import os
from pathlib import Path
from typing import List, Tuple

import PyPDF2
from openai import OpenAI

# Define the directory where PDF policies are stored
PDF_DIRECTORY = Path("insurance_policies")

# Initialize OpenAI client
client = OpenAI()


def get_policy_files() -> List[Path]:
    """
    Retrieve a list of all PDF files in the specified directory.

    Returns:
        List[Path]: A list of Path objects representing PDF files.
    """
    return list(PDF_DIRECTORY.glob("*.pdf"))


def load_pdf_text(file_path: str) -> str:
    """
    Extract text content from a PDF file.

    Args:
        file_path (str): The path to the PDF file.

    Returns:
        str: The extracted text content from the PDF.

    Raises:
        ValueError: If the file doesn't exist or isn't a PDF.
    """
    pdf_path = Path(file_path)
    if not pdf_path.exists() or pdf_path.suffix.lower() != ".pdf":
        raise ValueError(f"Invalid PDF file path: {file_path}")

    text = ""
    with pdf_path.open("rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = "".join(page.extract_text() for page in pdf_reader.pages)
    return text


def prepare_policy_data(policy_path: str) -> Tuple[str, str]:
    """
    Prepare policy data for comparison.

    Args:
        policy_path (str): The path to the policy file.

    Returns:
        Tuple[str, str]: A tuple containing the policy name and its text content.

    Raises:
        ValueError: If there's an error loading the PDF.
    """
    full_path = os.path.join(PDF_DIRECTORY, policy_path)
    try:
        policy_text = load_pdf_text(full_path)
        policy_name = Path(full_path).stem
        return policy_name, policy_text[
            :8000
        ]  # Limit text to 8000 characters to prevent potential issues with API limits.
    except ValueError as e:
        raise ValueError(f"Error loading policy {policy_path}: {str(e)}")


def compare_policies_query(policy1_path: str, policy2_path: str, query: str) -> str:
    """
    Compare two insurance policies based on a given query using OpenAI's GPT model.

    Args:
        policy1_path (str): The file name of the first policy.
        policy2_path (str): The file name of the second policy.
        query (str): The comparison query.

    Returns:
        str: The AI-generated comparison result.
    """

    try:
        policy1_name, policy1_text = prepare_policy_data(policy1_path)
        policy2_name, policy2_text = prepare_policy_data(policy2_path)
    except ValueError as e:
        return f"Error: {str(e)}"

    system_prompt = f"""
    Please compare the {policy1_name} and {policy2_name} insurance policies with respect to the following question:
    {query}
    
    Provide a concise answer in markdown format for easy reading and understanding, highlighting differences between the two policies.
    Use specific examples and quotes from the policies where relevant.
    If there are areas where one policy offers better coverage or terms, mention it.
    Do NOT rely on prior knowledge. Only use the information provided in the policies.
    """

    user_prompt = f"""
    Policy 1 ({policy1_name}) content:
    {policy1_text}

    Policy 2 ({policy2_name}) content:
    {policy2_text}
    """

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        result = completion.choices[0].message.content
        return result
    except Exception as e:
        error_message = f"Error during policy comparison: {str(e)}"
        return error_message
