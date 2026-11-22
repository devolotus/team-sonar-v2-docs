---
title: CI/CD e operação
sidebar_position: 7
---

# CI/CD e Operação

## Visão Geral da Infraestrutura
A aplicação é um serviço **ASP.NET Core** (SDK v10.0) hospedado na infraestrutura **AWS ECS**, conforme definido no arquivo de infraestrutura `devolotus.yaml`. O runtime especificado é **.NET 10**, com requisitos de recursos definidos como **0.5 CPU** e **1GB de memória**. A aplicação roda na porta **8080**, utilizando o container base `aspnet:10.0` (identificado no `Dockerfile`).

O ambiente de execução é gerenciado pelo Devolotus, configurado no namespace `team` para o projeto `sonar-v2`. O sistema depende criticamente de um pipeline externo, conforme indicado na seção de inferências do resumo: os workflows dependem de um repositório externo (`devolotus/devolotus-workflows`) para execução.

## Pipeline CI/CD
O fluxo de integração contínua e entrega (CI/CD) é orquestrado através de **GitHub Workflows**. O pipeline é acionado por eventos específicos:
*   **Pull Requests**: Acionamento em ramos de desenvolvimento.
*   **Push**: Ativação em ramos `develop`, `release` e `main`.

A promoção automática de builds ocorre exclusivamente no ambiente **DEV**. Os ambientes suportados são DEV, STG (Staging) e PRD (Production). As credenciais necessárias para o pipeline, incluindo tokens do scanner Sonar e configurações do Devolotus, são tratadas como segredos dentro dos arquivos `.yml` dos workflows.

## Estrutura de Construção e Imagens
A construção da aplicação é automatizada via **Dockerfile**. O processo envolve:
1.  Publicação local do projeto .NET.
2.  Empacotamento da imagem final utilizando a tag `aspnet:10.0`.
3.  Exposição da aplicação na porta **8080**.

O arquivo de projeto `.csproj` confirma o framework como `net10.0`, habilitando recursos como suporte a nulos implícitos e usings globais. A análise estática é realizada pelo **SonarScanner**, que exige variáveis de ambiente específicas (`SONAR_PROJECT_KEY`, `SONAR_HOST_URL`, `SONAR_TOKEN`).

## Estrutura de Testes
A validação do software é executada através da framework **xUnit** com cobertura gerada pelo **Coverlet**. Os relatórios de cobertura são exportados no formato **OpenCover XML**.

Os testes unitários e de integração focam em:
*   **Endpoint de Configurações (`SettingsEndpointTests.cs`)**: Verifica a fusão dinâmica de arquivos JSON (via `JsonConfigurationProvider`) e a exclusão de chaves sensíveis (como `TokenKey`, marcada como `[REDACTED]`).
*   **Cliente de Taxa de Câmbio (`ExchangeRateClientTests.cs`)**: Valida a normalização de códigos de moeda (ex: "usd" para "USD") e o tratamento de exceções em chamadas HTTP.
*   **Endpoint de Flags (`FeatureFlagEndpointTests.cs`)**: Simula respostas de flags de recurso para ambientes diferentes, distinguindo erros de lógica (400) de falhas de provedor (502/503).

Os testes utilizam `Microsoft.AspNetCore.Mvc.Testing` e `WebApplicationFactory`, empregando handlers personalizados (`StubHandler`) para simular respostas HTTP sem realizar chamadas de rede reais. Isso isola a lógica de negócios, mas não valida a resiliência da rede em produção.

## Lacunas e Inferências Não Encontradas
*   **Credenciais Específicas**: O valor exato da constante `TokenKey` está redigido no código como `[REDACTED]`. O padrão para `Devolotus__BaseAddress` é inferido como `http://localhost:8080`, mas não confirmado explicitamente em strings de conexão visíveis.
*   **Dependências NuGet**: Os pacotes específicos (como `Microsoft.Extensions.Configuration.DeveloperConfiguration`) não foram listados explicitamente nos arquivos fornecidos, embora sejam implícitos pelo uso de interfaces do framework.
*   **Versão .NET**: A referência a `net10.0` indica uma versão recente ou futura, o que pode impactar a compatibilidade com ferramentas de CI/CD padrão se não houver suporte oficial consolidado em todos os ambientes.
*   **Segurança de Filtragem**: A lógica de exclusão de chaves baseia-se estritamente na lista de metadados e arquivos JSON, sem uma camada adicional de validação de segurança explícita além da remoção do token.
*   **Caminhos Relativos**: Os caminhos relatados (`src/App/`, `tests/App.Tests/`) são relativos ao projeto; a localização absoluta depende da estrutura do repositório GitHub.
