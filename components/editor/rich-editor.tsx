"use client";
import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Undo2,
} from "lucide-react";

/** Editor de texto rico que lê e grava Markdown (somente formatos seguros: títulos, ênfase, listas, citação, link). */
export default function RichEditor({
  value,
  onChange,
  placeholder = "Escreva aqui o seu texto…",
  editable = true,
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, protocols: ["mailto"], defaultProtocol: "https" },
      }),
      Markdown,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    contentType: "markdown",
    editorProps: { attributes: { class: "rte-content", "aria-label": "Texto do artigo" } },
    onUpdate: ({ editor: e }) => onChange(e.getMarkdown()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return <div className="rte"><div className="rte-loading">Carregando editor…</div></div>;

  const btn = (label: string, active: boolean, run: () => void, icon: React.ReactNode, disabled = false) => (
    <button
      type="button"
      className={"rte-btn" + (active ? " active" : "")}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled || !editable}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {icon}
    </button>
  );

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link (https://…)", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) {
      window.alert("Use um endereço que comece com https://");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Formatação">
        {btn("Título", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={18} />)}
        {btn("Subtítulo", editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 size={18} />)}
        <span className="rte-sep" />
        {btn("Negrito", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold size={17} />)}
        {btn("Itálico", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic size={17} />)}
        {btn("Link", editor.isActive("link"), setLink, <Link2 size={17} />)}
        <span className="rte-sep" />
        {btn("Lista", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List size={18} />)}
        {btn("Lista numerada", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={18} />)}
        {btn("Citação", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote size={17} />)}
        {btn("Linha divisória", false, () => editor.chain().focus().setHorizontalRule().run(), <Minus size={18} />)}
        <span className="rte-sep" />
        {btn("Desfazer", false, () => editor.chain().focus().undo().run(), <Undo2 size={17} />, !editor.can().undo())}
        {btn("Refazer", false, () => editor.chain().focus().redo().run(), <Redo2 size={17} />, !editor.can().redo())}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
