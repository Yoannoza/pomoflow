import { NextResponse } from "next/server";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "7cef0b3a-245d-4612-8fd0-9fc4d66b4e98";

async function queryNotionDatabase() {
  if (!NOTION_API_KEY) {
    return [];
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        and: [
          {
            property: "Statut",
            status: {
              does_not_equal: "Done",
            },
          },
          {
            property: "Statut",
            status: {
              does_not_equal: "Fait",
            },
          },
        ],
      },
      sorts: [
        { property: "Échéance", direction: "ascending" },
      ],
      page_size: 20,
    }),
    next: { revalidate: 30 },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data.results.map((page: Record<string, unknown>) => {
    const props = page.properties as Record<string, Record<string, unknown>>;
    return {
      id: page.id,
      title: getTitle(props["Tâche"]),
      status: getSelect(props["Statut"]),
      priority: getSelect(props["Priorité"]),
      dueDate: getDate(props["Échéance"]),
      type: getSelect(props["Type"]),
      energy: getSelect(props["Énergie"]),
      context: getSelect(props["Contexte"]),
    };
  });
}

function getTitle(prop: Record<string, unknown> | undefined): string {
  if (!prop) return "";
  const title = prop.title as Array<{ plain_text: string }> | undefined;
  return title?.[0]?.plain_text || "";
}

function getSelect(prop: Record<string, unknown> | undefined): string {
  if (!prop) return "";
  const status = prop.status as { name: string } | undefined;
  if (status) return status.name;
  const select = prop.select as { name: string } | undefined;
  return select?.name || "";
}

function getDate(prop: Record<string, unknown> | undefined): string | null {
  if (!prop) return null;
  const date = prop.date as { start: string } | undefined;
  return date?.start || null;
}

export async function GET() {
  if (!NOTION_API_KEY) {
    return NextResponse.json(
      { tasks: [], error: "NOTION_API_KEY not configured" },
      { status: 200 }
    );
  }
  const tasks = await queryNotionDatabase();
  return NextResponse.json({ tasks });
}

export async function PATCH(request: Request) {
  if (!NOTION_API_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const { taskId, status } = await request.json();

  const res = await fetch(`https://api.notion.com/v1/pages/${taskId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        Statut: { status: { name: status } },
      },
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
