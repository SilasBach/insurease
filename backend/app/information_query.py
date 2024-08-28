import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

import PyPDF2
from llama_index.agent.openai import OpenAIAgent
from llama_index.core import (
    Document,
    Settings,
    StorageContext,
    SummaryIndex,
    VectorStoreIndex,
    load_index_from_storage,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.objects import ObjectIndex
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Define the directory where your PDF policies are stored
PDF_DIRECTORY = Path("insurance_policies")


def initialize_settings():
    try:
        Settings.llm = OpenAI(temperature=0, model="gpt-4o-mini")
        Settings.embed_model = OpenAIEmbedding(model="text-embedding-ada-002")
        return SentenceSplitter()
    except Exception as e:
        logger.error(f"Failed to initialize global settings: {str(e)}")
        raise


def build_folder_structure_index(base_path: Path) -> Dict[str, List[str]]:
    """
    Build a dictionary representing the folder structure of insurance policies.

    Args:
        base_path (Path): The base directory containing company folders.

    Returns:
        Dict[str, List[str]]: A dictionary with company names as keys and lists of policy names as values.
    """
    folder_structure = {}
    try:
        for company in base_path.iterdir():
            if company.is_dir():
                folder_structure[company.name] = [
                    pdf.name for pdf in company.glob("*.pdf")
                ]
        return folder_structure
    except Exception as e:
        logger.error(f"Error building folder structure index: {str(e)}")
        return {}


def load_pdf(file_path: str) -> Optional[List[Document]]:
    """
    Load a PDF file and convert it to a list of Document objects.

    Args:
        file_path (str): The path to the PDF file.

    Returns:
        Optional[List[Document]]: A list containing a single Document object with the PDF's text content,
                                  or None if an error occurs.
    """
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = "".join(page.extract_text() for page in pdf_reader.pages)
        return [Document(text=text, metadata={"source": file_path})]
    except Exception as e:
        logger.error(f"Error loading PDF {file_path}: {str(e)}")
        return None


# Build agents dictionary
agents = {}
query_engines = {}

# This is for the baseline
all_nodes = []


def create_agents_and_databases():
    node_parser = initialize_settings()
    agents = {}
    query_engines = {}
    all_tools = []

    for company_folder in PDF_DIRECTORY.iterdir():
        if company_folder.is_dir():
            company_name = company_folder.name
            for policy_file in company_folder.glob("*.pdf"):
                policy_name = policy_file.stem
                full_policy_name = f"{company_name}_{policy_name}"

                policy_docs = load_pdf(str(policy_file))
                nodes = node_parser.get_nodes_from_documents(policy_docs)

                index_path = company_folder / f"{full_policy_name}_index"
                if not os.path.exists(index_path):
                    vector_index = VectorStoreIndex(nodes)
                    vector_index.storage_context.persist(persist_dir=index_path)
                else:
                    vector_index = load_index_from_storage(
                        StorageContext.from_defaults(persist_dir=index_path),
                    )

                summary_index = SummaryIndex(nodes)

                vector_query_engine = vector_index.as_query_engine(llm=Settings.llm)
                summary_query_engine = summary_index.as_query_engine(llm=Settings.llm)

                query_engine_tools = [
                    QueryEngineTool(
                        query_engine=vector_query_engine,
                        metadata=ToolMetadata(
                            name=f"vector_tool_{full_policy_name}",
                            description=(
                                f"Useful for questions related to specific aspects of the {company_name} {policy_name} insurance policy "
                                "(e.g. coverage details, exclusions, premiums, or more)."
                            ),
                        ),
                    ),
                    QueryEngineTool(
                        query_engine=summary_query_engine,
                        metadata=ToolMetadata(
                            name=f"summary_tool_{full_policy_name}",
                            description=(
                                f"Useful for any requests that require a holistic summary of EVERYTHING about the {company_name} {policy_name} "
                                "insurance policy. For questions about more specific sections, please use the vector_tool."
                            ),
                        ),
                    ),
                ]

                function_llm = OpenAI(model="gpt-4o-mini")
                agent = OpenAIAgent.from_tools(
                    query_engine_tools,
                    llm=function_llm,
                    verbose=False,
                    system_prompt=f"""\
You are a specialized agent designed to answer queries about the {company_name} {policy_name} insurance policy.
You must ALWAYS use at least one of the tools provided when answering a question; do NOT rely on prior knowledge.\
""",
                )

                agents[full_policy_name] = agent
                query_engines[full_policy_name] = vector_index.as_query_engine(
                    similarity_top_k=2
                )

                doc_tool = QueryEngineTool(
                    query_engine=agent,
                    metadata=ToolMetadata(
                        name=f"tool_{full_policy_name}",
                        description=f"This tool provides information about the {company_name} {policy_name} insurance policy. Use "
                        f"this tool for any questions specifically about the {company_name} {policy_name} policy.\n",
                    ),
                )
                all_tools.append(doc_tool)

    obj_index = ObjectIndex.from_objects(
        all_tools,
        index_cls=VectorStoreIndex,
    )

    top_agent = OpenAIAgent.from_tools(
        all_tools,
        system_prompt=""" \
You are an expert Danish insurance agent designed to answer queries about various insurance policies from different companies.
Your primary task is to provide accurate information based on the specific insurance policies you have access to.

Here are your instructions:
1. ALWAYS use at least one of the provided tools to answer questions. Do not rely on prior knowledge.
2. When a query mentions a specific company or policy, use the corresponding tool.
3. If you don't have access to information about a specific policy or company mentioned in the query, clearly state this limitation.
""",
        verbose=False,
    )

    return agents, query_engines, top_agent


agents, query_engines, top_agent = create_agents_and_databases()


def process_query(query, top_agent=top_agent):
    response = top_agent.query(query)
    return response.response
