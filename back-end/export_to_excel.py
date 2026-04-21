import json
import pandas as pd
from style_excel import style_excel

INPUT_FILE = "useCases.json"
OUTPUT_FILE = "useCases.xlsx"

with open(INPUT_FILE, "r") as f:
    data = json.load(f)


def expected_result_to_text(expected_result):
    # Empty
    if expected_result is None:
        return ""

    if isinstance(expected_result, str):
        return expected_result

    def bullets(title, items):
        if not items:
            return ""
        out = [f"{title}:"]
        for x in items:
            out.append(f"- {x}")
        return "\n".join(out)

    def format_obj(obj):
        if not isinstance(obj, dict):
            return str(obj)

        fields = obj.get("Fields", [])
        action_buttons = obj.get("Action Buttons", [])
        parts = []
        if fields:
            parts.append(bullets("Fields", fields))
        if action_buttons:
            parts.append(bullets("Action Buttons", action_buttons))

        # if dict but not shape we expect, fall back to string
        return "\n".join(p for p in parts if p)

    # list of objects
    if isinstance(expected_result, list):
        return "\n\n".join(format_obj(x) for x in expected_result)

    # single object
    return format_obj(expected_result)


rows = []

for group in data:
    for use_case_block in group.get("Use Cases", []):
        use_case_name = use_case_block.get("Use Case", "")

        rows.append({"Field": "Use Case", "Value": use_case_name})

        for test_case_block in use_case_block.get("Test Cases", []):
            title = test_case_block.get("Test Case Title", "")
            desc = test_case_block.get("Test Case Description", "")
            expected_result = test_case_block.get("Expected Result", "")

            task = test_case_block.get("Task Content", {}) or {}
            intent = ",".join(task.get("Test Intent", ""))
            test_type = "\n".join(f"-{t}" for t in task.get("Test Type", ""))
            pre_condition = task.get("Pre Condition", "").replace("،", "\n")
            steps = task.get("Steps", []) or []
            rows.append(
                {
                    "Field": "Test Case Title",
                    "Value": title,
                    "Expected Result": "",
                }
            )
            rows.append(
                {
                    "Field": "Test Case Description",
                    "Value": desc,
                    "Expected Result": "",
                }
            )
            rows.append(
                {
                    "Field": "Expected Result",
                    "Value": expected_result,
                    "Expected Result": "",
                }
            )
            rows.append(
                {
                    "Field": "Test Intent",
                    "Value": intent,
                    "Expected Result": "",
                }
            )
            rows.append(
                {
                    "Field": "Test Type",
                    "Value": test_type,
                    "Expected Result": "",
                }
            )
            rows.append(
                {
                    "Field": "Pre Condition",
                    "Value": pre_condition,
                    "Expected Result": "",
                }
            )
            for step in steps:
                step_no = step.get("Step Number")
                action = step.get("Action")
                expected_result = expected_result_to_text(step.get("Expected Result"))
                rows.append(
                    {
                        "Field": step_no,
                        "Value": action,
                        "Expected Result": expected_result,
                    }
                )


# Create DataFrame
df = pd.DataFrame(rows)
# Save to Excel
df.to_excel(OUTPUT_FILE, index=False)
print(f"Data exported to {OUTPUT_FILE}")


style_excel(OUTPUT_FILE)
