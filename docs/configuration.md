---
title: Configuração e execução local
sidebar_position: 5
---

# Configuração e execução local

## Requisitos do Sistema
A aplicação é desenvolvida no framework **ASP.NET Core** utilizando o SDK v10.0 (`.net10.0`). Para rodar localmente, é necessário um ambiente de desenvolvimento compatível com a versão .NET 10.0 ou superior. O projeto utiliza arquivos de configuração JSON (`appsettings.json`) e depende de bibliotecas do ecossistema Microsoft para gerenciamento de configurações e testes.

## Estrutura do Projeto
Os caminhos relatados indicam uma estrutura de projetos separados:
*   Código principal: `src/App/`
*   Projetos de teste: `tests/App.Tests/`

O arquivo de projeto principal é definido como `.csproj`, configurando o framework para `net10.0`. O suporte a nulos implícitos e usings está habilitado nas definições do projeto.

## Configuração Inicial
Para iniciar a aplicação localmente, os seguintes passos devem ser seguidos:

1.  **Restaurar Pacotes:** Execute o comando de restauração no diretório raiz ou no projeto específico para baixar as dependências NuGet implícitas (como `Microsoft.Extensions.Configuration.Json` e `System.Text.Json`).
    ```bash
    dotnet restore
    ```

2.  **Configurar Arquivos de Ambiente:** A aplicação lê configurações do arquivo `appsettings.json`. Certifique-se de que este arquivo contém as chaves necessárias para as APIs externas (`RatesApi`) e serviços internos (`Devolotus`). O formato das chaves segue a convenção `parent:child` (ex: `RatesApi:BaseAddress`).

3.  **Executar a Aplicação:**
    *   Navegue até o diretório do projeto principal (`src/App/`).
    *   Execute o comando de publicação e execução para iniciar o servidor web na porta **8080**.
    ```bash
    dotnet run
    ```

## Endpoints Disponíveis
Uma vez executada, a aplicação expõe os seguintes endpoints REST:

*   `/health`: Endpoint de saúde.
*   `/settings`: Retorna as configurações do Devolotus fundidas em um objeto JSON estruturado. O cabeçalho `Cache-Control` é definido como `no-store`.
*   `/feature-flags/{environment}`: Exibe as taxas de flags para um ambiente específico (ex: DEV, STG).
*   `/login-demo/{environment}`: Endpoint demonstrativo que alterna entre autenticação legada ou nova baseada nas flags.

## Execução de Testes Locais
Os testes são escritos em **xUnit** e executam cobertura via **Coverlet**, gerando relatórios OpenCover XML. Para rodar os testes localmente:

1.  Navegue até o diretório de testes (`tests/App.Tests/`).
2.  Execute o comando para iniciar a sessão de teste usando `WebApplicationFactory`, que simula respostas HTTP sem fazer chamadas de rede reais (utilizando `StubHandler`).
    ```bash
    dotnet test
    ```

Os testes validam:
*   Normalização de códigos de moeda (ex: "usd" para "USD").
*   Comportamento de endpoints de flags em diferentes estados (`enabled`, `disabled`, `out-of-scope`).
*   Fusão correta de configurações e exclusão de chaves sensíveis.

## Observações sobre Dependências e Configuração
*   **Runtime:** O projeto exige o runtime `.NET 10.0`. Verifique a instalação do SDK correspondente no seu sistema local.
*   **Credenciais:** Os valores exatos de `Devolotus__BaseAddress` (padrão `http://localhost:8080`) e o ID da aplicação (`5c475c50-c8e9-477d-b38e-ed9654853890`) são referenciados, mas não expostos como strings de conexão diretas no código fonte visível. A chave `TokenKey` está redigida (`[REDACTED]`) nos arquivos analisados.
*   **Análise Estática:** Se a análise estática pelo SonarScanner for necessária localmente, configure as variáveis de ambiente `SONAR_PROJECT_KEY`, `SONAR_HOST_URL` e `SONAR_TOKEN`.

## Lacunas e Limitações Identificadas
*   **Versão do .NET:** A versão `.net10.0` é indicada como recente ou em desenvolvimento ativo; verifique a estabilidade da ferramenta de publicação local para esta versão específica.
*   **Dependências NuGet:** Os pacotes específicos não foram listados explicitamente nos arquivos fornecidos, dependendo da inferência do uso de `IConfiguration`.
*   **Simulação vs. Realidade:** A execução local dos testes utiliza mocks (`StubHandler`), isolando a lógica do cliente mas não validando a resiliência real da rede ou timeouts externos (timeout de 5s definido no código).
*   **Validação de Moeda:** A lógica de normalização é estrita, aceitando apenas letras ASCII, o que pode limitar a usabilidade para códigos de moeda exóticos.
