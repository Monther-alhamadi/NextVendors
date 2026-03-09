import uvicorn

# Optionally configure logging if needed (reuse project logging defaults)

if __name__ == '__main__':
    import main

    uvicorn.run(main.app, host='127.0.0.1', port=8000)
