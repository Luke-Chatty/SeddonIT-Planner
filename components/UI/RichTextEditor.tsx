'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border border-border rounded-xl overflow-hidden bg-background shadow-sm', className)}>
      {/* Toolbar - larger touch targets and icons for readability */}
      <div className="flex items-center gap-1 p-2.5 border-b border-border bg-muted/40 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('bold') && 'bg-primary/10 text-primary'
          )}
          title="Bold"
          aria-label="Bold"
        >
          <Bold className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('italic') && 'bg-primary/10 text-primary'
          )}
          title="Italic"
          aria-label="Italic"
        >
          <Italic className="w-5 h-5" />
        </Button>
        <div className="w-px h-7 bg-border mx-0.5" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('heading', { level: 1 }) && 'bg-primary/10 text-primary'
          )}
          title="Heading 1"
          aria-label="Heading 1"
        >
          <Heading1 className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('heading', { level: 2 }) && 'bg-primary/10 text-primary'
          )}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <Heading2 className="w-5 h-5" />
        </Button>
        <div className="w-px h-7 bg-border mx-0.5" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('bulletList') && 'bg-primary/10 text-primary'
          )}
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('orderedList') && 'bg-primary/10 text-primary'
          )}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={cn(
            'h-10 w-10 p-0 min-w-[2.5rem]',
            editor?.isActive('blockquote') && 'bg-primary/10 text-primary'
          )}
          title="Quote"
          aria-label="Quote"
        >
          <Quote className="w-5 h-5" />
        </Button>
        <div className="w-px h-7 bg-border mx-0.5" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="h-10 w-10 p-0 min-w-[2.5rem]"
          title="Undo"
          aria-label="Undo"
        >
          <Undo className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="h-10 w-10 p-0 min-w-[2.5rem]"
          title="Redo"
          aria-label="Redo"
        >
          <Redo className="w-5 h-5" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none min-h-[220px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}