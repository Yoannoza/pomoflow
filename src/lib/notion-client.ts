// Direct Notion API client for Tauri desktop mode
// Mirrors the logic in src/app/api/notion/tasks/route.ts

export interface NotionCredentials {
  apiKey: string;
  databaseId: string;
}

export function getNotionCredentials(): NotionCredentials | null {
  const raw = localStorage.getItem("pomoflow-notion-credentials");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveNotionCredentials(creds: NotionCredentials) {
  localStorage.setItem("pomoflow-notion-credentials", JSON.stringify(creds));
}

export async function fetchNotionTasksDirect(creds: NotionCredentials) {
  // Use Tauri HTTP plugin to bypass CORS
  const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");

  const res = await tauriFetch(
    `https://api.notion.com/v1/databases/${creds.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Statut", status: { does_not_equal: "Done" } },
            { property: "Statut", status: { does_not_equal: "Fait" } },
          ],
        },
        sorts: [{ property: "Échéance", direction: "ascending" }],
        page_size: 20,
      }),
    }
  );

  if (!res.ok) return [];
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.map((page: any) => {
    const props = page.properties;
    return {
      id: page.id,
      title: props?.["Tâche"]?.title?.[0]?.plain_text || "",
      status: props?.["Statut"]?.status?.name || props?.["Statut"]?.select?.name || "",
      priority: props?.["Priorité"]?.select?.name || "",
      dueDate: props?.["Échéance"]?.date?.start || null,
      type: props?.["Type"]?.select?.name || "",
      energy: props?.["Énergie"]?.select?.name || "",
      context: props?.["Contexte"]?.select?.name || "",
    };
  });
}

export async function updateNotionTaskDirect(
  creds: NotionCredentials,
  taskId: string,
  status: string
) {
  const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");

  await tauriFetch(`https://api.notion.com/v1/pages/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${creds.apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        Statut: { status: { name: status } },
      },
    }),
  });
}
