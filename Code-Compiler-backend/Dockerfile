FROM public.ecr.aws/lambda/python:3.11

# Install Java (Amazon Corretto 11)
RUN yum install -y java-11-amazon-corretto java-11-amazon-corretto-devel

# Install Python dev tools
RUN yum install -y python3-devel

# Install Node.js and npm
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash - && \
    yum install -y nodejs

# Copy requirements and install them
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy the Lambda function
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

# ✅ This is the key line that tells Lambda how to launch your function
CMD ["lambda_function.lambda_handler"]