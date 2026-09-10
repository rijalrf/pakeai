// Tree Diagram page: Hierarki App → Fitur → Sub-fitur → Task (lihat saja, tidak edit)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, FolderTree } from 'lucide-react';

type TreeNode = {
  id: string;
  projectId: string;
  parentId: string | null;
  label: string;
  kind: 'app' | 'feature' | 'subfeature' | 'task' | 'subtask';
  order: number;
};

export function TreePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Load atau generate tree on mount
  useEffect(() => {
    if (!projectId) return;

    const loadOrGenerateTree = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}/tree`, {
          credentials: 'include',
        });
        const json = await res.json();

        if (json.nodes && json.nodes.length > 0) {
          setNodes(json.nodes);
        } else {
          // Auto generate jika kosong
          await generateTree();
        }
      } catch (err) {
        console.error('Gagal load tree:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrGenerateTree();
  }, [projectId]);

  const generateTree = async () => {
    if (!projectId) return;
    setGenerating(true);

    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/tree/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const refreshRes = await fetch(`http://localhost:6655/api/projects/${projectId}/tree`, {
          credentials: 'include',
        });
        const refreshJson = await refreshRes.json();
        setNodes(refreshJson.nodes || []);
      } else {
        console.warn('Generate tree gagal');
      }
    } catch (err) {
      console.error('Error generating tree:', err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  // Build tree structure dari flat nodes
  const buildTree = () => {
    const nodeMap = new Map<string, TreeNode & { children?: TreeNode[] }>();
    const roots: TreeNode[] = [];

    // Initialize all nodes
    for (const node of nodes) {
      nodeMap.set(node.id, { ...node, children: [] });
    }

    // Connect children
    for (const node of nodes) {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children?.push(nodeMap.get(node.id)!);
        }
      } else {
        roots.push(nodeMap.get(node.id)!);
      }
    }

    return { roots, nodeMap };
  };

  // Render tree recursively
  const renderNode = (node: any, level: number = 0) => {
    const colorClass =
      node.kind === 'app'
        ? 'border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-950/10'
        : node.kind === 'feature'
        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/10'
        : node.kind === 'subfeature'
        ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/10'
        : 'border-orange-600 dark:border-orange-400 bg-orange-50 dark:bg-orange-950/10';

    return (
      <div key={node.id} className="space-y-2" style={{ marginLeft: `${level * 24}px` }}>
        <Card className={`border-2 ${colorClass}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {node.kind.toUpperCase()}
              </Badge>
              {node.label}
            </CardTitle>
          </CardHeader>
          {node.children && node.children.length > 0 && (
            <CardContent className="pt-0">
              {node.children.map((child: any) => renderNode(child, level + 1))}
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  const { roots } = buildTree();

  if (loading || generating) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Skeleton header */}
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-2 flex-1">
              <div className="h-7 bg-muted w-1/3 rounded animate-pulse" />
              <div className="h-4 bg-muted w-1/4 rounded animate-pulse" />
            </div>
          </div>

          {/* Skeleton diagram */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted w-1/4 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="pl-4 border-l-2 border-muted p-4">
                  <div className="h-12 bg-muted rounded animate-pulse" />
                  {i < 3 && (
                    <div className="pl-8 mt-2 space-y-2">
                      <div className="h-10 bg-muted rounded animate-pulse" />
                      <div className="h-10 bg-muted rounded animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FolderTree className="h-6 w-6 text-green-600 dark:text-green-400" />
              Struktur Aplikasi
            </h1>
            <p className="text-muted-foreground mt-1">
              Hierarki fitur dan tugas yang akan diimplementasikan
            </p>
          </div>
          {!roots.length && !generating && (
            <Button onClick={generateTree} size="sm" className="gap-2">
              Generate Structure
            </Button>
          )}
        </div>
      </div>

      {/* Tree Diagram */}
      <div className="max-w-5xl mx-auto pb-8 min-h-[300px]">
        {roots.length > 0 ? (
          roots.map((root: any) => renderNode(root))
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Struktur belum ada. Klik "Generate Structure".
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tombol Lanjut */}
      <div className="max-w-5xl mx-auto flex justify-end">
        <Button size="lg" onClick={() => navigate(`/projects/${projectId}/board`)} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          Lihat Board Task
        </Button>
      </div>
    </div>
  );
}
