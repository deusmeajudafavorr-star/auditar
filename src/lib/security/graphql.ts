import { Finding } from "./types";
import { createFinding } from "./findings";

export function analyzeGraphQLResponse(
  targetUrl: string,
  graphqlFound: boolean,
  introspectionEnabled: boolean
): Finding[] {
  const findings: Finding[] = [];

  if (!graphqlFound) return findings;

  findings.push(
    createFinding({
      title: "Endpoint GraphQL Identificado (/graphql)",
      severity: "INFO",
      confidence: "HIGH",
      category: "GraphQL",
      url: `${targetUrl}/graphql`,
      evidence: "Endpoint HTTP GraphQL respondendo na rota padrão /graphql",
      impact: "Identificação de API GraphQL para testes defensivos de esquema.",
      recommendation: "Assegure limitação de taxa (rate limit), limite de profundidade de query (query depth) e desative introspection em ambiente de produção.",
    })
  );

  if (introspectionEnabled) {
    findings.push(
      createFinding({
        title: "Introspecção GraphQL (Introspection) Habilitada em Produção",
        severity: "MEDIUM",
        confidence: "HIGH",
        category: "GraphQL",
        url: `${targetUrl}/graphql`,
        evidence: "Query __schema retornou o esquema completo de tipos, queries e mutations",
        impact: "Permite que atacantes mapeiem 100% da estrutura da API, tipos de dados e funções internas da aplicação.",
        recommendation: "Desative a introspecção GraphQL em ambientes de produção.",
      })
    );
  }

  return findings;
}
