# chat-gpt-telegram-content-maker

> Nest TS  
> telegram-bot-api  
> openai  

## Installation

```bash
make cp-env
```

##### After you must configure your app in .env file

```bash
make install
make migrate
```

View docker container logs

```bash
make logs
```

## Build Setup

### Production

```bash
make
```

### Building for production

To building for production you need to change `COMPOSE_FILE` param in *.env* to *docker-compose.prod.yml* and follow the above steps

### Development

```bash
make dev
```

## Migrations

Create migration:  

```bash
yarn knex migrate:make [name]
```

Migrations list:  

```bash
yarn knex migrate:list
```

Up migration:  

```bash
yarn knex migrate:up
```

Down migration:  

```bash
yarn knex migrate:down
```
