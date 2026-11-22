---
title: Limitações e informações não encontradas
sidebar_position: 8
---

# Limitações e informações não encontradas

A documentação fornecida apresenta inconsistências significativas entre os resumos de lote, sugerindo que o código fonte completo ou arquivos críticos (como `appsettings.json`, `Program.cs` e workflows completos) não estão disponíveis para análise direta. A seguir, detalham-se as lacunas identificadas, baseando-se estritamente nas evidências dos resumos e citando os símbolos e caminhos mencionados.

### 1. Ausência de Credenciais e Valores de Configuração Exatos
Não foi possível obter os valores reais das credenciais ou chaves de configuração devido à redação explícita no texto.
*   **Credenciais do Devolotus:** O resumo menciona que `Devolotus__BaseAddress` tem um padrão de `http://localhost:8080`, mas afirma que não são expostas como strings de conexão diretas no código fonte. A classe `FeatureFlagClient` valida dinamicamente a `Devolotus:ApplicationId` e `Devolotus:BaseAddress`, mas o valor exato do ID (`5c475c50-c8e9-477d-b38e-ed9654853890`) é apenas referenciado textualmente.
*   **Token de Scanner:** O símbolo `[REDACTED]` aparece explicitamente no resumo referente à constante `TokenKey`. Não há evidência de onde este token reside fisicamente (se em um arquivo `.env`, variável de ambiente ou workflow oculto), impedindo a reprodução da configuração de análise estática.
*   **Segredos nos Workflows:** Embora o resumo afirme que credenciais e tokens são tratados como segredos nos workflows `.yml`, os arquivos de workflow (`devolotus/devolotus-workflows`) não foram anexados à documentação, tornando impossível verificar a segurança da implementação ou a existência real desses segredos.

### 2. Dependências NuGet e Versão do Framework Incerta
A versão do runtime é declarada como `.NET 10` (SDK v10.0) e `net10.0`, mas isso indica um ambiente potencialmente futuro ou em desenvolvimento ativo, o que cria uma lacuna sobre a disponibilidade de pacotes oficiais.
*   **Pacotes NuGet:** O resumo afirma que os pacotes específicos (como `Microsoft.Extensions.Configuration.DeveloperConfiguration`) não foram listados explicitamente nos arquivos fornecidos. Sem acesso ao arquivo `.csproj` completo ou lista de pacotes (`packages.config`/`.csproj`), é impossível confirmar as versões exatas das dependências, o que impacta a reprodutibilidade da build.
*   **Sistema de Arquivos:** A lógica de fusão de configurações depende de `JsonConfigurationProvider` para carregar múltiplos arquivos JSON dinamicamente. Não foi encontrado o arquivo `appsettings.json` ou qualquer outro arquivo de configuração, nem a estrutura exata das chaves (`parent:child`) além da menção genérica a `RatesApi:BaseAddress`.

### 3. Lacunas na Lógica de Negócio e Tratamento de Erros
A análise do resumo revela uma dependência de comportamento que não pode ser verificada sem o código fonte executável ou os arquivos de lógica completos.
*   **Validação de Moeda:** O resumo afirma que a validação é estrita (apenas letras ASCII), mas não fornece o código da classe `ExchangeRateClient.cs` para confirmar se essa regra é aplicada antes ou após a normalização ("usd" para "USD"). A lógica de lançamento de exceções (`JsonException`, `ArgumentException`) é descrita, mas os tipos exatos de exceção e suas mensagens não estão disponíveis.
*   **Comportamento de Erros HTTP:** O resumo menciona que falhas externas retornam códigos 502 ou 503 em `Program.cs`. No entanto, sem o código do endpoint `/health` ou a lógica global de tratamento de exceções (`try-catch`), não é possível determinar se há mecanismos de retry, circuit breakers ou logs detalhados para esses erros.
*   **Filtragem de Chaves:** A remoção de chaves sensíveis baseia-se em uma lista derivada dos arquivos JSON e metadados. Não foi encontrada a implementação da lógica que exclui `TokenKey` ou as chaves `DEVOLOTUS_APPSETTINGS_KEYS`, o que impede a validação da eficácia dessa filtragem contra injeção de dados maliciosos.

### 4. Dependências Externas e Infraestrutura
A aplicação depende criticamente de componentes externos cuja configuração não foi documentada.
*   **APIs Externas:** O cliente `ExchangeRateClient.cs` faz referência a `api.frankfurter.dev`, mas o resumo confirma que os testes usam `StubHandler` para simular respostas, sem validar a resiliência real da rede. Não há evidências de fallback ou tratamento de falhas de conexão com essa API externa.
*   **Infraestrutura AWS ECS:** O runtime é hospedado na AWS ECS com requisitos específicos (CPU 0.5, Memória 1GB). Não foi encontrado o arquivo `devolotus.yaml` completo para verificar se há configurações de escalonamento automático, políticas de segurança do grupo ou volumes anexados que possam afetar a execução da aplicação em produção.
*   **Pipeline CI/CD:** O pipeline depende de um repositório externo (`devolotus/devolotus-workflows`). Como o conteúdo desse repositório não está disponível, é impossível determinar as etapas de build, deploy ou validação de segurança executadas automaticamente.

### 5. Estrutura de Testes e Cobertura
Embora os nomes dos testes (`ExchangeRateClientTests.cs`, etc.) sejam citados, a implementação real não foi acessível.
*   **Cobertura Real:** O resumo menciona relatórios OpenCover XML gerados pelo Coverlet, mas sem o arquivo de relatório ou o código fonte completo, é impossível calcular a cobertura real das classes `FeatureFlagClient` e `SettingsEndpoint`.
*   **Ambiente de Teste:** Os testes utilizam `WebApplicationFactory`, mas não foi encontrado o código que configura o ambiente virtualizado para simular os endpoints `/feature-flags/{environment}` com diferentes estados (`enabled`, `disabled`, `out-of-scope`).

### Conclusão das Lacunas
A documentação atual é insuficiente para uma análise de segurança profunda ou reprodutibilidade técnica. Os caminhos relatados (`src/App/`, `tests/App.Tests/`) e símbolos (`[REDACTED]`, `TokenKey`, `FeatureFlagClient`) apontam para a existência de arquivos que não foram fornecidos. As inferências sobre o comportamento da aplicação (ex: validação de moeda, tratamento de erro 502) são baseadas em descrições textuais e não em evidência de código executável ou fontes confiáveis. Para mitigar essas lacunas, seria necessário acesso direto aos arquivos `.csproj`, `appsettings.json`, `Program.cs` e aos workflows do GitHub mencionados.
