FROM python:3.10-alpine

WORKDIR /code
ADD requirements.txt .
RUN pip --no-cache-dir install -r requirements.txt
ADD app ./app

WORKDIR /code/app
CMD ["fastapi", "run", "main.py", "--proxy-headers", "--port", "80"]
