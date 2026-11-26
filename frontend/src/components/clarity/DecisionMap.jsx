import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactFlow, Background, Controls, Handle, MiniMap, Position, useEdgesState, useNodesState, addEdge, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronDown, ChevronUp, Maximize2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Modal, Textarea } from '../common'
import { CONSEQUENCE_FIELDS } from './tac'
import { uid } from '../../utils/id'
import { cn } from '../../utils/cn'

const KIND_STYLE = {
  root: 'bg-gradient-to-br from-primary to-[#A97FD6] text-white border-transparent',
  action: 'bg-surface text-ink border-primary',
  note: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-400/10 dark:text-amber-100',
}
const FIELD_BY_KIND = Object.fromEntries(CONSEQUENCE_FIELDS.map((f) => [f.kind, f]))

function TacNode({ data, selected }) {
  const f = FIELD_BY_KIND[data.kind]
  return (
    <div
      className={cn('max-w-[200px] min-w-[130px] rounded-2xl border-2 px-3 py-2 text-left shadow-soft transition-shadow', KIND_STYLE[data.kind] || 'bg-surface text-ink', selected && 'shadow-lift ring-2 ring-primary/50')}
      style={f ? { borderColor: f.color, background: f.color + '18' } : undefined}
    >
      <Handle type="target" position={Position.Top} className="!size-2.5 !border-2 !border-white !bg-primary" />
      {f && <div className="mb-0.5 text-[9px] font-bold tracking-wider uppercase" style={{ color: f.color }}>{f.label}</div>}
      {data.kind === 'action' && <div className="mb-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">Action</div>}
      {data.kind === 'note' && <div className="mb-0.5 text-[9px] font-bold tracking-wider uppercase opacity-70">Note</div>}
      <div className={cn('text-[12px] leading-snug font-semibold break-words', data.kind === 'root' && 'text-[13px]')}>{data.label || '…'}</div>
      {data.kind === 'action' && data.count > 0 && (
        <button onClick={data.onToggle} className="nodrag mt-1.5 flex items-center gap-1 text-[10px] font-bold text-primary">
          {data.expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          {data.expanded ? 'Collapse' : `Show ${data.count} consequences`}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="!size-2.5 !border-2 !border-white !bg-primary" />
    </div>
  )
}
const nodeTypes = { tac: TacNode }

function layout(draft, expanded, toggle) {
  const nodes = [{ id: 'root', type: 'tac', position: { x: 0, y: 0 }, data: { kind: 'root', label: draft.title || 'My decision' }, deletable: false }]
  const edges = []
  const n = draft.actions.length
  const gap = 240
  draft.actions.forEach((a, i) => {
    const x = (i - (n - 1) / 2) * gap
    const filled = CONSEQUENCE_FIELDS.filter((f) => a[f.key]?.trim())
    const isOpen = expanded[a.id] !== false
    nodes.push({ id: a.id, type: 'tac', position: { x, y: 140 }, data: { kind: 'action', label: a.label, actionId: a.id, count: filled.length, expanded: isOpen, onToggle: () => toggle(a.id) } })
    edges.push({ id: `root-${a.id}`, source: 'root', target: a.id, animated: draft.chosen === a.id, style: { stroke: '#8B72C7', strokeWidth: draft.chosen === a.id ? 3 : 2 } })
    if (isOpen)
      filled.forEach((f, j) => {
        const id = `${a.id}:${f.key}`
        nodes.push({ id, type: 'tac', position: { x: x + (j % 2 ? 30 : -30), y: 280 + j * 95 }, data: { kind: f.kind, label: a[f.key], actionId: a.id, field: f.key } })
        edges.push({ id: `${a.id}-${id}`, source: j === 0 ? a.id : `${a.id}:${filled[j - 1].key}`, target: id, style: { stroke: f.color, strokeWidth: 1.5 } })
      })
  })
  draft.extraNodes.forEach((x) => nodes.push({ id: x.id, type: 'tac', position: x.position, data: { kind: 'note', label: x.label } }))
  draft.extraEdges.forEach((e) => edges.push({ ...e, style: { stroke: '#E9A86B', strokeWidth: 1.5, strokeDasharray: '5 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#E9A86B' } }))
  return { nodes, edges }
}

export function DecisionMap({ draft, onChange, height = 'h-[62dvh]' }) {
  const [expanded, setExpanded] = useState({})
  const toggle = useCallback((id) => setExpanded((e) => ({ ...e, [id]: e[id] === false })), [])
  const built = useMemo(() => layout(draft, expanded, toggle), [draft, expanded, toggle])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [rf, setRf] = useState(null)

  useEffect(() => {
    setNodes((prev) =>
      built.nodes.map((n) => {
        const p = prev.find((x) => x.id === n.id)
        const saved = draft.positions?.[n.id]
        return { ...n, position: p ? p.position : saved || n.position, selected: p?.selected }
      }),
    )
    setEdges(built.edges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built])

  const selected = nodes.find((n) => n.selected)

  const onNodeDragStop = (_, node) => {
    if (node.data.kind === 'note') onChange({ ...draft, extraNodes: draft.extraNodes.map((x) => (x.id === node.id ? { ...x, position: node.position } : x)) })
    else onChange({ ...draft, positions: { ...draft.positions, [node.id]: node.position } })
  }

  const onConnect = (c) => {
    if (c.source === c.target) return
    const e = { id: uid('e'), source: c.source, target: c.target }
    setEdges((eds) => addEdge(e, eds))
    onChange({ ...draft, extraEdges: [...draft.extraEdges, e] })
  }

  const removeNodes = (ids) => {
    let d = { ...draft }
    ids.forEach((id) => {
      if (id === 'root') return
      const n = nodes.find((x) => x.id === id)
      if (!n) return
      if (n.data.kind === 'note') d = { ...d, extraNodes: d.extraNodes.filter((x) => x.id !== id) }
      else if (n.data.kind === 'action') d = { ...d, actions: d.actions.filter((a) => a.id !== id), chosen: d.chosen === id ? null : d.chosen }
      else d = { ...d, actions: d.actions.map((a) => (a.id === n.data.actionId ? { ...a, [n.data.field]: '' } : a)) }
      d.extraEdges = d.extraEdges.filter((e) => e.source !== id && e.target !== id)
    })
    onChange(d)
  }

  const onEdgesDelete = (eds) => {
    const ids = eds.map((e) => e.id)
    if (eds.some((e) => draft.extraEdges.find((x) => x.id === e.id))) onChange({ ...draft, extraEdges: draft.extraEdges.filter((x) => !ids.includes(x.id)) })
  }

  const openEdit = (node) => {
    setEditing(node)
    setEditText(node.data.label || '')
  }
  const saveEdit = () => {
    const v = editText.trim()
    if (!v) return
    const n = editing
    if (n.data.kind === 'root') onChange({ ...draft, title: v })
    else if (n.data.kind === 'note') onChange({ ...draft, extraNodes: draft.extraNodes.map((x) => (x.id === n.id ? { ...x, label: v } : x)) })
    else if (n.data.kind === 'action') onChange({ ...draft, actions: draft.actions.map((a) => (a.id === n.id ? { ...a, label: v } : a)) })
    else onChange({ ...draft, actions: draft.actions.map((a) => (a.id === n.data.actionId ? { ...a, [n.data.field]: v } : a)) })
    setEditing(null)
  }

  const addNote = () => {
    const anchor = selected || nodes.find((n) => n.id === 'root')
    const id = uid('note')
    const position = { x: (anchor?.position.x || 0) + 220, y: (anchor?.position.y || 0) + 60 }
    const e = anchor ? { id: uid('e'), source: anchor.id, target: id } : null
    onChange({ ...draft, extraNodes: [...draft.extraNodes, { id, label: 'New thought', position }], extraEdges: e ? [...draft.extraEdges, e] : draft.extraEdges })
    setTimeout(() => openEdit({ id, data: { kind: 'note', label: 'New thought' } }), 50)
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button size="sm" icon={Plus} onClick={addNote}>
          Add node
        </Button>
        <Button size="sm" variant="secondary" icon={Pencil} disabled={!selected} onClick={() => openEdit(selected)}>
          Edit
        </Button>
        <Button size="sm" variant="danger-soft" icon={Trash2} disabled={!selected || selected.id === 'root'} onClick={() => removeNodes([selected.id])}>
          Delete
        </Button>
        <Button size="sm" variant="ghost" icon={Maximize2} onClick={() => rf?.fitView({ padding: 0.2, duration: 400 })}>
          Fit
        </Button>
      </div>
      <div className={cn('overflow-hidden rounded-3xl border border-line bg-surface-2/50', height)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={(ns) => removeNodes(ns.map((n) => n.id))}
          onEdgesDelete={onEdgesDelete}
          onNodeDoubleClick={(_, n) => openEdit(n)}
          onInit={setRf}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
          deleteKeyCode={['Delete', 'Backspace']}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={22} size={1.2} color="var(--c-line)" />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap pannable zoomable className="!hidden sm:!block" nodeColor={(n) => (n.data.kind === 'root' ? '#8B72C7' : FIELD_BY_KIND[n.data.kind]?.color || '#D8C7F4')} />
        </ReactFlow>
      </div>
      <p className="mt-2 text-xs text-muted">Tip: double-tap a node to edit · drag from a node’s bottom dot to another node to connect · tap an action to expand or collapse.</p>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit node"
        footer={
          <Button className="w-full" onClick={saveEdit} disabled={!editText.trim()}>
            Save
          </Button>
        }
      >
        <Textarea rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={200} autoFocus error={!editText.trim() ? 'Node text can’t be empty' : undefined} />
      </Modal>
    </div>
  )
}
