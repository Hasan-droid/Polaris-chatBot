from pydantic import BaseModel, Field


class Response(BaseModel):
    use_cases: list["UseCase"] = Field(alias="Use Cases")


class UseCase(BaseModel):
    use_case_name: str = Field(alias="Use Case")
    test_cases: list["TestCase"] = Field(alias="Test Cases")


class TestCase(BaseModel):
    test_case_title: str = Field(alias="Test Case Title")
    test_case_description: str = Field(alias="Test Case Description")
    expected_result: str = Field(alias="Expected Result")
    pre_condition: str = Field(alias="Pre Condition")
    task_content: "TaskContent" = Field(alias="Task Content")


class TaskContent(BaseModel):
    test_intent: list[str] = Field(alias="Test Intent")
    test_type: list[str] = Field(alias="Test Type")
    steps: list["Step"] = Field(alias="Steps")

    class Step(BaseModel):
        step_number: int = Field(alias="Step Number")
        action: str = Field(alias="Action")
        expected_result: str = Field(alias="Expected Result")
