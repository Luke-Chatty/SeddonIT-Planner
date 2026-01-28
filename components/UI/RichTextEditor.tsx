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
    <div className={cn('border border-border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('bold') && 'bg-primary/10 text-primary'
          )}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('italic') && 'bg-primary/10 text-primary'
          )}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('heading', { level: 1 }) && 'bg-primary/10 text-primary'
          )}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('heading', { level: 2 }) && 'bg-primary/10 text-primary'
          )}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('bulletList') && 'bg-primary/10 text-primary'
          )}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('orderedList') && 'bg-primary/10 text-primary'
          )}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor?.isActive('blockquote') && 'bg-primary/10 text-primary'
          )}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}