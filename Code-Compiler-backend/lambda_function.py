import sys
import subprocess
import io
import json
import traceback

def execute_python_code(code):
    original_stdout = sys.stdout
    output_capture = io.StringIO()
    sys.stdout = output_capture
    
    try:
        # Create a namespace for execution
        namespace = {}
        
        # If code contains unittest.main(), replace it with a custom test runner
        if "unittest.main()" in code:
            # Replace unittest.main() with a pass so it doesn't exit
            modified_code = code.replace("if __name__ == \"__main__\":\n    unittest.main()", 
                                        "if __name__ == \"__main__\":\n    pass")
            
            # Execute the modified code that defines the test classes
            exec(modified_code, namespace)
            
            # Now manually run the tests with a custom test runner
            import unittest
            test_loader = unittest.TestLoader()
            
            # Find all test classes in the namespace
            test_suite = unittest.TestSuite()
            for name, obj in namespace.items():
                if isinstance(obj, type) and issubclass(obj, unittest.TestCase) and obj != unittest.TestCase:
                    tests = test_loader.loadTestsFromTestCase(obj)
                    test_suite.addTests(tests)
            
            # Run the tests with a runner that writes to our StringIO
            test_runner = unittest.TextTestRunner(stream=output_capture, verbosity=2)
            test_result = test_runner.run(test_suite)
            
            # Add a summary of the results
            print(f"\nTest Summary: {test_result.testsRun} tests run, "
                  f"{len(test_result.errors)} errors, "
                  f"{len(test_result.failures)} failures")
        else:
            # For normal code execution
            exec(code, namespace)
        
        return output_capture.getvalue()
    except Exception as e:
        traceback_info = traceback.format_exc()
        print("Python execution error:", traceback_info)
        return f"Error: {str(e)}\n\n{traceback_info}"
    finally:
        sys.stdout = original_stdout

def execute_java_code(code):
    try:
        with open('/tmp/Main.java', 'w') as java_file:
            java_file.write(code)

        compile_result = subprocess.run(
            ['javac', '/tmp/Main.java'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        if compile_result.returncode != 0:
            print("Java compile error:", compile_result.stderr.decode())
            return compile_result.stderr.decode()

        run_result = subprocess.run(
            ['java', '-classpath', '/tmp', 'Main'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        return run_result.stdout.decode() if run_result.returncode == 0 else run_result.stderr.decode()

    except Exception as e:
        print("Java execution error:", traceback.format_exc())
        return str(e)

def execute_javascript_code(code):
    try:
        with open('/tmp/script.js', 'w') as js_file:
            js_file.write(code)

        result = subprocess.run(
            ['node', '/tmp/script.js'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        return result.stdout.decode() if result.returncode == 0 else result.stderr.decode()

    except Exception as e:
        print("JavaScript execution error:", traceback.format_exc())
        return str(e)

def lambda_handler(event, context):
    print("===== Lambda Handler Triggered =====")
    print("HTTP Method:", event.get("httpMethod"))
    print("Raw event received:", json.dumps(event))

    # ✅ Handle CORS preflight requests
    if event.get("httpMethod", "").upper() == "OPTIONS":
        print("Handling preflight OPTIONS request")
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Max-Age": "3600"
            },
            "body": ""
        }

    # ✅ Parse request body
    try:
        body = event.get("body", "")
        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body
        print("Parsed data:", data)
    except Exception as e:
        print("Failed to parse body:", traceback.format_exc())
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            "body": json.dumps({"error": f"Failed to parse request body: {str(e)}"})
        }

    # ✅ Execute code
    language = data.get('language', 'python').lower()
    code = data.get('code', '')
    print(f"Executing code in language: {language}")

    try:
        if language == 'python':
            result = execute_python_code(code)
        elif language == 'javascript':
            result = execute_javascript_code(code)
        elif language == 'java':
            result = execute_java_code(code)
        else:
            result = f"Unsupported language: {language}"
    except Exception as e:
        print("Execution error:", traceback.format_exc())
        result = f"Execution error: {str(e)}"

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': "*",
            'Access-Control-Allow-Headers': "*",
            'Access-Control-Allow-Methods': "POST,OPTIONS"
        },
        'body': json.dumps({"message": result})
    }