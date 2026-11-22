---
title: Testes e validação
sidebar_position: 6
---

# Testes e Validação

A validação do software descrito no lote de código fonte (SHA: `f6717db10666ddfbf5771ecbb9db5491af08d519`) baseia-se em uma estratégia híbrida que combina testes unitários com simulação de ambiente, utilizando o framework **xUnit** e a biblioteca **Microsoft.AspNetCore.Mvc.Testing**. A cobertura do código é medida pelo **Coverlet**, gerando relatórios no formato OpenCover XML.

## Estrutura de Testes e Ambientes de Execução

Os testes estão localizados na pasta `tests/App.Tests/` e são divididos em três domínios principais, cada um focado em componentes específicos da aplicação ASP.NET Core (.NET 10.0):

1.  **Testes de Cliente de Taxa de Câmbio (`ExchangeRateClientTests.cs`)**:
    *   **Objetivo**: Validar a lógica de normalização de códigos de moeda e o tratamento de exceções em chamadas externas.
    *   **Mecanismo**: Utiliza `WebApplicationFactory` para criar um contexto de teste isolado, evitando chamadas de rede reais contra `api.frankfurter.dev`.
    *   **Evidências**: O teste verifica se códigos como `"usd"` são normalizados para `"USD"`. Ele também valida que pares inválidos sejam rejeitados antes da tentativa de requisição, lançando exceções específicas (`JsonException`, `ArgumentException`). Um timeout de 5 segundos é configurado no cliente.
    *   **Lacunas**: Não há validação de resiliência de rede real; a simulação via `StubHandler` pode não refletir comportamentos de falha em produção (ex: timeouts reais, erros de conexão TCP).

2.  **Testes de Endpoints de Feature Flags (`FeatureFlagEndpointTests.cs`)**:
    *   **Objetivo**: Garantir que os endpoints REST `/feature-flags/{environment}` retornem estados corretos (`enabled`, `disabled`, `out-of-scope`) baseados em configurações JSON.
    *   **Mecanismo**: Simula a lógica de autenticação legada versus nova, dependendo do valor da flag. Distingue erros de ambiente inválido (HTTP 400) de falhas no provedor (HTTP 502).
    *   **Evidências**: Os testes utilizam handlers personalizados para injetar respostas JSON específicas antes que a aplicação tente acessar o `FeatureFlagClient`.

3.  **Testes de Configurações (`SettingsEndpointTests.cs`)**:
    *   **Objetivo**: Validar a fusão dinâmica de arquivos JSON e a filtragem de dados sensíveis no endpoint `/settings`.
    *   **Mecanismo**: Verifica se chaves protegidas (indicadas por `[REDACTED]`, como `TokenKey`) e metadados internos (`DEVOLOTUS_APPSETTINGS_KEYS`) são excluídos do resultado final.
    *   **Evidências**: O teste confirma que a concatenação de configurações segue o formato `parent:child` (ex: `RatesApi:BaseAddress`) e que cabeçalhos como `Cache-Control: no-store` são aplicados corretamente.

## Ferramentas e Configurações do Pipeline CI/CD

A validação é orquestrada através de workflows do GitHub, acionados por eventos em ramos `develop`, `release` e `main`. O pipeline depende de um repositório externo (`devolotus/devolotus-workflows`) para execução.

*   **Análise Estática**: Utiliza o **SonarScanner** para .NET. A configuração exige variáveis de ambiente específicas:
    *   `SONAR_PROJECT_KEY`
    *   `SONAR_HOST_URL`
    *   `SONAR_TOKEN` (tratado como segredo).
*   **Infraestrutura**: A aplicação é empacotada via Dockerfile usando o runtime `aspnet:10.0`, exposta na porta **8080**. O ambiente de execução é AWS ECS com requisitos de 0.5 CPU e 1GB de memória.

## Limitações e Incertezas Identificadas

Apesar da cobertura dos testes, existem lacunas significativas derivadas da natureza do código fornecido:

*   **Simulação vs. Realidade**: A ausência de requisições reais contra `api.frankfurter.dev` ou servidores locais impede a validação de latência real e falhas de rede não tratadas internamente (o código retorna 502/503 para erros externos sem tratamento adicional).
*   **Credenciais Ocultas**: O valor exato da constante `TokenKey` está redigido como `[REDACTED]`, impedindo a verificação completa de políticas de segurança de filtragem.
*   **Dependências Implícitas**: Os pacotes NuGet específicos (como `Microsoft.Extensions.Configuration.DeveloperConfiguration`) não foram listados explicitamente nos arquivos fornecidos, criando uma lacuna na rastreabilidade das dependências.
*   **Validação de Moeda**: A lógica de validação é estrita para letras ASCII, o que pode ser considerado uma limitação funcional não coberta pelos testes atuais se houver necessidade de suporte a moedas exóticas no futuro.

Em suma, os testes validam a integridade da lógica de negócios e a estrutura de dados em um ambiente controlado, mas não garantem a robustez do sistema frente a falhas de infraestrutura externas ou comportamentos de rede reais.
