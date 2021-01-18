FROM python:3.8
WORKDIR /app/backend
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . ./
CMD gunicorn --bind 0.0.0.0:5000 wsgi:app