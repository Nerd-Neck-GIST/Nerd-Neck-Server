FROM python:3.10.0

RUN apt update

WORKDIR /home/ubuntu/

RUN mkdir .virtualenvs/

WORKDIR /home/ubuntu/.virtualenvs/

RUN pip install virtualenv

RUN virtualenv nerdneck

SHELL ["/bin/bash", "-c"]

RUN source nerdneck/bin/activate

SHELL ["/bin/sh", "-c"]

WORKDIR /home/ubuntu/nerdneck/

COPY ./ /home/ubuntu/nerdneck/

RUN pip3 install -r /home/ubuntu/nerdneck/requirements.txt

RUN pip3 install gunicorn

RUN pip3 install uvicorn[standard]

RUN python manage.py collectstatic --settings=nerdneck.settings --noinput
