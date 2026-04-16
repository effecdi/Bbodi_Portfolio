#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { profile, skills, techStack, projects } from "./data.js";

const server = new McpServer({
  name: "bbodi-portfolio",
  version: "1.0.0",
});

// ── Resources ──────────────────────────────────────────────

server.resource("profile", "portfolio://profile", {
  description: "Bbodi의 프로필 정보 (이름, 직함, 경력, 철학, 이메일)",
  mimeType: "application/json",
}, async () => ({
  contents: [
    {
      uri: "portfolio://profile",
      mimeType: "application/json",
      text: JSON.stringify(profile, null, 2),
    },
  ],
}));

server.resource("skills", "portfolio://skills", {
  description: "Bbodi의 핵심 스킬 목록",
  mimeType: "application/json",
}, async () => ({
  contents: [
    {
      uri: "portfolio://skills",
      mimeType: "application/json",
      text: JSON.stringify({ skills, techStack }, null, 2),
    },
  ],
}));

server.resource("projects", "portfolio://projects", {
  description: "Bbodi의 주요 프로젝트 목록",
  mimeType: "application/json",
}, async () => ({
  contents: [
    {
      uri: "portfolio://projects",
      mimeType: "application/json",
      text: JSON.stringify(projects, null, 2),
    },
  ],
}));

// ── Tools ──────────────────────────────────────────────────

server.tool(
  "get_portfolio_overview",
  "Bbodi 포트폴리오의 전체 요약을 반환합니다 (프로필, 스킬, 프로젝트 수).",
  {},
  async () => {
    const overview = {
      profile: {
        name: profile.name,
        title: profile.title,
        experience: profile.experience,
      },
      skills,
      projectCount: projects.length,
      email: profile.email,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(overview, null, 2) }],
    };
  },
);

server.tool(
  "get_projects",
  "프로젝트 목록을 반환합니다. 역할(role) 키워드로 필터링할 수 있습니다.",
  { role_filter: z.string().optional().describe("역할 키워드로 필터링 (예: 'Design', 'Publishing')") },
  async ({ role_filter }) => {
    let filtered = projects;
    if (role_filter) {
      const keyword = role_filter.toLowerCase();
      filtered = projects.filter((p) =>
        p.role.toLowerCase().includes(keyword),
      );
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(filtered, null, 2) }],
    };
  },
);

server.tool(
  "get_project_detail",
  "ID로 특정 프로젝트의 상세 정보를 반환합니다.",
  { project_id: z.number().describe("프로젝트 ID (1-5)") },
  async ({ project_id }) => {
    const project = projects.find((p) => p.id === project_id);
    if (!project) {
      return {
        content: [{ type: "text" as const, text: `프로젝트 ID ${project_id}을(를) 찾을 수 없습니다.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(project, null, 2) }],
    };
  },
);

server.tool(
  "get_skills_and_tech",
  "Bbodi의 스킬 목록과 기술 스택을 반환합니다.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ skills, techStack }, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "get_contact",
  "Bbodi의 연락처 정보를 반환합니다.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { name: profile.realName, email: profile.email },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ── Start ──────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bbodi Portfolio MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
