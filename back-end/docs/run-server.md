# Run The Server

## Requirements

- Python `3.12` or newer
- an OpenAI API key

## 1. Install dependencies

If you use `uv`, run:

```bash
uv sync
```

If you use `pip`, run:

```bash
pip install -e .
```

## 2. Add environment variables

Create a `.env` file in the project root and add:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 3. Start the server

You can run the app directly:

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 4. Open the API

Local server:

`http://localhost:8000`

Swagger UI:

`http://localhost:8000/docs`

OpenAPI JSON:

`http://localhost:8000/openapi.json`

## 5. Quick checks

Health check:

```bash
curl http://localhost:8000/health
```

Files endpoint:

```bash
curl http://localhost:8000/files
```

Streaming endpoint:

```bash
curl -N -X POST http://localhost:8000/chat/stream \
  -F "file_path=sample.pdf" \
  -F "question=What is this document about?" \
  -F "model=gpt-4o"
```

## Notes

- The server enables CORS for all origins.
- Uploaded form fields for `/chat/stream` are expected as `multipart/form-data`.
- The current `/chat/stream` implementation should be reviewed before production use because the posted `file_path` is not currently used to select the input file.
