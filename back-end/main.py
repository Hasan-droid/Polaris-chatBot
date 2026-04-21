from openai import OpenAI, APIError
from openai.lib._parsing import get_input_tool_by_name
from DocParser import extract_text, chunk_text
from LLmPrompt import START_PROMPT
import json
import time
import re
from json_repair import repair_json
import os
from dotenv import load_dotenv
from AI_Response_Structure import Response

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def detect_language(text):
    return "ar" if re.search(r"[\u0600-\u06FF]", text) else "en"


def generate_useCases(file_path, model="gpt-4o"):
    text = extract_text(file_path)
    chunks = chunk_text(text)
    all_responses = []

    # Start time
    start_time = time.time()
    for i, chunk in enumerate(chunks, 1):
        lang = detect_language(chunk)
        prompt = START_PROMPT.format(data=chunk, lang=lang)
        try:
            if stream:
                streamed = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.0,
                    stream=True,
                )

                response_parts = []
                for event in streamed:
                    delta = event.choices[0].delta
                    content = getattr(delta, "content", None)
                    if content:
                        print(content, end="", flush=True)
                        response_parts.append(content)

                print()  # newline after each chunk stream completes
                response = "".join(response_parts)
        except APIError as e:
            print(f"API Error on chunk {i}: {e}")
            print(f"Error type: {e.type}")
            print(f"Error code: {e.code}")
            raise e

        # fixed_response = repair_json(response)
        json_response = json.loads(response)
        all_responses.append(json_response)

        if i < len(chunks):
            time.sleep(2)

    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    # write to json file
    with open("useCases.json", "w") as f:
        json.dump(all_responses, f, ensure_ascii=False, indent=2)


# generate_useCases("DOS_SRS V 1.1.docx")
# generate_useCases("DOS_SRS V 1.1.docx")
if __name__ == "__main__":
    generate_useCases("part-1.docx")
