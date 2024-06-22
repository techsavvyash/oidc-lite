### FusionAuth and Hasura setup
This documentation will help you setup fusionauth and hasura in your own development environment to get accustomed to.

**docker-compose.yml**
```
version: '3'

services:
  db:
    image: postgres:16.0-bookworm
    environment:
      PGDATA: /var/lib/postgresql/data/pgdata
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U postgres" ]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - db_net
    restart: always
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - 5432:5432

  search:
    image: opensearchproject/opensearch:2.11.0
    environment:
      cluster.name: fusionauth
      discovery.type: single-node
      node.name: search
      plugins.security.disabled: true
      bootstrap.memory_lock: true
      OPENSEARCH_JAVA_OPTS: ${OPENSEARCH_JAVA_OPTS}
    healthcheck:
      interval: 10s
      retries: 80
      test: curl --write-out 'HTTP %{http_code}' --fail --silent --output /dev/null http://localhost:9200/
    restart: unless-stopped
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    ports:
      - 9200:9200 # REST API
      - 9600:9600 # Performance Analyzer
    volumes:
      - search_data:/usr/share/opensearch/data
    networks:
      - search_net

  fusionauth:
    image: fusionauth/fusionauth-app:latest
    depends_on:
      db:
        condition: service_healthy
      search:
        condition: service_healthy
    environment:
      DATABASE_URL: jdbc:postgresql://db:5432/fusionauth
      DATABASE_ROOT_USERNAME: ${POSTGRES_USER}
      DATABASE_ROOT_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      FUSIONAUTH_APP_MEMORY: ${FUSIONAUTH_APP_MEMORY}
      FUSIONAUTH_APP_RUNTIME_MODE: ${FUSIONAUTH_APP_RUNTIME_MODE}
      FUSIONAUTH_APP_URL: http://fusionauth:9011
      SEARCH_SERVERS: http://search:9200
      SEARCH_TYPE: elasticsearch
    healthcheck:
      test: curl --silent --fail http://localhost:9011/api/status -o /dev/null -w "%{http_code}"
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - db_net
      - search_net
    restart: unless-stopped
    ports:
      - 9011:9011
    volumes:
      - fusionauth_config:/usr/local/fusionauth/config
    
  graphql-engine:
    image: hasura/graphql-engine:v2.38.0
    ports:
      - "8080:8080"
    restart: always
    environment:
      ## postgres database to store Hasura metadata
      HASURA_GRAPHQL_METADATA_DATABASE_URL: postgres://postgres:postgres@db:5432/postgres
      ## this env var can be used to add the above postgres database to Hasura as a data source. this can be removed/updated based on your needs
      PG_DATABASE_URL: postgres://postgres:postgres@db:5432/fusionauth
      ## enable the console served by server
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true" # set to "false" to disable console
      ## enable debugging mode. It is recommended to disable this in production
      HASURA_GRAPHQL_DEV_MODE: "true"
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: startup, http-log, webhook-log, websocket-log, query-log
      ## uncomment next line to run console offline (i.e load console assets from server instead of CDN)
      # HASURA_GRAPHQL_CONSOLE_ASSETS_DIR: /srv/console-assets
      ## uncomment next line to set an admin secret
      HASURA_GRAPHQL_ADMIN_SECRET: myadminsecretkey
      HASURA_GRAPHQL_METADATA_DEFAULTS: '{"backend_configs":{"dataconnector":{"athena":{"uri":"http://data-connector-agent:8081/api/v1/athena"},"mariadb":{"uri":"http://data-connector-agent:8081/api/v1/mariadb"},"mysql8":{"uri":"http://data-connector-agent:8081/api/v1/mysql"},"oracle":{"uri":"http://data-connector-agent:8081/api/v1/oracle"},"snowflake":{"uri":"http://data-connector-agent:8081/api/v1/snowflake"}}}}'
    depends_on:
      data-connector-agent:
        condition: service_healthy
    networks:
      - db_net
      - search_net
    
  data-connector-agent:
    image: hasura/graphql-data-connector:v2.38.0
    restart: always
    ports:
      - 8081:8081
    environment:
      QUARKUS_LOG_LEVEL: ERROR # FATAL, ERROR, WARN, INFO, DEBUG, TRACE
      ## https://quarkus.io/guides/opentelemetry#configuration-reference
      QUARKUS_OPENTELEMETRY_ENABLED: "false"
      ## QUARKUS_OPENTELEMETRY_TRACER_EXPORTER_OTLP_ENDPOINT: http://jaeger:4317
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/api/v1/athena/health"]
      interval: 5s
      timeout: 10s
      retries: 5
      start_period: 5s

networks:
  db_net:
    driver: bridge
  search_net:
    driver: bridge

volumes:
  db_data:
  fusionauth_config:
  search_data:
```

Create the file with the given contents.
After creating the file
1. `docker compose up -d`
2. FusionAuth on `localhost:9011`
3. Hasura on `localhost:8080/console`
4. After you are done, do `docker compose down -v`