# Leeplate

Leeplate is a privacy-oriented alternative frontend for translation providers,
built using the FastAPI framework. It allows users to translate text between
different languages and listen to translations in spoken form.

This project is created by [Nachtalb](https://github.com/Nachtalb) and the
source repository can be found at
[https://github.com/Nachtalb/leeplate](https://github.com/Nachtalb/leeplate).

## Features

- Translate text between different languages
- Listen to translations in spoken form
- Download text to speech files
- FastAPI implementation

## Installation

The installation is done using [Poetry](https://python-poetry.org/). To install
the project, follow these steps:

```bash
# Clone the repository
git clone https://github.com/Nachtalb/leeplate.git
# Navigate to the project directory
cd leeplate
# Install the dependencies using Poetry
poetry install
# Run the FastAPI server
poetry run leeplate
```

### Installation using Docker

You can also run the application using Docker. There are two methods to do this:
using the Docker CLI command or using Docker Compose.

#### Docker CLI

To run the application using the Docker CLI, execute the following command:

```bash
docker run --name leeplate -p 8000:8000 ghcr.io/nachtalb/leeplate:latest
```

The application will be accessible at `http://localhost:8000`.

#### Docker Compose

Alternatively, you can use Docker Compose to run the application. Create a file
named `docker-compose.yml` with the following content:

```yaml
version: "3"

services:
  leeplate:
    image: ghcr.io/nachtalb/leeplate:latest
    container_name: leeplate
    ports:
      - "8000:8000"
    restart: unless-stopped
```

Now, run the following command to start the application using Docker Compose:

```bash
docker-compose up -d
```

The application will be accessible at `http://localhost:8000`.

## Usage

Once the application is running, navigate to `http://localhost:8000` in your
browser to access the interactive translation interface. You can enter the text
you want to translate, select the source and target languages, and click on the
"Translate" button to get the translated text.

You can also listen to the translated text in spoken form by clicking on the
"Listen" button.

## License

This project is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html).
