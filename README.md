# Domain Redirection

## Installation

1. Clone the repository:
```
git clone https://github.com/your-username/redirect-service.git
```

2. Install dependencies:
```
cd redirection-mx
bun install
```

3. Ensure you have an `redirects.xlsx` file in the project root directory, containing the redirect rules.

## Usage

1. Start the server:
```
bun run src/index.ts
```

2. The server will listen on `http://localhost:3000`.

3. Any requests to the server will be checked against the redirect rules in the Excel file. If a matching rule is found, the user will be redirected to the specified destination URL with the configured status code (default is 301 Moved Permanently).

4. If no matching rule is found, a 404 Not Found response will be returned.

## API

The server exposes a single route that handles all incoming requests:

- `GET /*` - Checks the incoming request against the redirect rules and either redirects the user or returns a 404 response.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature/bug fix.
3. Implement your changes and add tests.
4. Run the tests and ensure they pass:
```
npm test
```
5. Commit your changes and push the branch.
6. Submit a pull request.

## License

Accenture © Khadka Baniya

## Testing

The project uses Vitest for unit testing. To run the tests, execute:

```
bun run test
```

To run the tests in watch mode:

```
bun run test:watch
```

To generate a coverage report:

```
bun run coverage
```