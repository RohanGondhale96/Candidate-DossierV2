"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import { cn } from "@/lib/utils";

interface InlineEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  /** Apply read-only mode (e.g. client review). */
  editable?: boolean;
}

/**
 * Reusable inline rich-text field built on Tiptap. Renders as plain resume text
 * until focused; no visible toolbar — formatting via keyboard shortcuts only
 * (Ctrl/Cmd+B bold, Ctrl/Cmd+I italic, Ctrl/Cmd+Shift+8 bullet list).
 *
 * For single-line fields (multiline=false) Enter is suppressed and the value is
 * stored as plain text; multiline fields store HTML.
 */
export function InlineEditor({
  content,
  onChange,
  placeholder,
  multiline = true,
  className,
  editable = true,
}: InlineEditorProps) {
  // Always call the latest onChange — the Tiptap onBlur handler is bound once
  // at editor creation, so without this ref it could capture a stale closure
  // (and a stale section-data snapshot) and drop edits across fields.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: false,
        ...(multiline
          ? {}
          : { bulletList: false, orderedList: false, blockquote: false }),
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn("focus:outline-none", className),
      },
      handleKeyDown: (_view, event) => {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          (event.target as HTMLElement)?.blur?.();
          return true;
        }
        return false;
      },
    },
    onBlur: ({ editor }) => {
      const value = multiline ? editor.getHTML() : editor.getText();
      onChangeRef.current(value);
    },
  });

  // Keep the editor in sync when content is replaced externally
  // (version restore, template reset, AI insertion — Phase 2).
  useEffect(() => {
    if (!editor) return;
    const current = multiline ? editor.getHTML() : editor.getText();
    if (content !== current && !editor.isFocused) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor, multiline]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  return (
    <div className={cn("inline-editable", !editable && "pointer-events-none")}>
      <EditorContent editor={editor} />
    </div>
  );
}
