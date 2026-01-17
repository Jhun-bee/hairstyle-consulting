FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/
COPY mcp_server.py .

# Create directories
RUN mkdir -p uploads results

# Expose port
EXPOSE 8080

# Run MCP server
CMD ["python", "mcp_server.py", "--transport", "sse"]
