'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function DocsPage() {
  const [content, setContent] = useState('');
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch('/api/docs');
        const text = await response.text();
        setContent(text);

        // Extract headings
        const headingRegex = /^(#{1,3})\s+(.+)$/gm;
        const foundHeadings: Heading[] = [];
        let match;

        while ((match = headingRegex.exec(text)) !== null) {
          const level = match[1].length;
          const text = match[2];
          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');

          foundHeadings.push({ id, text, level });
        }

        setHeadings(foundHeadings);

        // Check if there's a hash in the URL and scroll to it
        if (typeof window !== 'undefined') {
          const hash = window.location.hash.slice(1); // Remove the # symbol
          if (hash) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
              const element = document.getElementById(hash);
              if (element) {
                const offset = 80;
                const elementPosition = element.offsetTop;
                window.scrollTo({
                  top: elementPosition - offset,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to load docs:', error);
        setContent('# Error loading documentation\n\nPlease try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map((h) => document.getElementById(h.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeading(headings[i].id);
          break;
        }
      }
    };

    // Handle hash change events
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            const offset = 80;
            const elementPosition = element.offsetTop;
            window.scrollTo({
              top: elementPosition - offset,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚔️</div>
          <p className="text-gray-400">Loading ancient scrolls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4">
                Table of Contents
              </h3>
              <nav className="space-y-2 pr-2">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToHeading(heading.id)}
                    className={`
                      block w-full text-left text-sm transition-colors
                      ${activeHeading === heading.id
                        ? 'text-yellow-500 font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                      }
                      ${heading.level === 2 ? 'ml-0' : 'ml-4'}
                    `}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-gradient-to-br from-red-950/5 to-black border border-red-900/20 rounded-lg p-8 md:p-12">
              <article className="markdown-content prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
                        className="text-4xl md:text-5xl font-bold text-yellow-500 border-b-2 border-red-900 pb-4 mb-8"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
                        className="text-3xl font-bold text-gray-100 mt-12 mb-6"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
                        className="text-2xl font-semibold text-gray-200 mt-8 mb-4"
                        {...props}
                      />
                    ),
                    h4: ({ node, ...props }) => (
                      <h4
                        id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
                        className="text-xl font-semibold text-gray-300 mt-6 mb-3"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-gray-300 leading-relaxed mb-4" {...props} />
                    ),
                    a: ({ node, href, children, ...props }: any) => {
                      const isInternalLink = href?.startsWith('#');

                      if (isInternalLink) {
                        const targetId = href.slice(1);
                        return (
                          <a
                            href={href}
                            className="text-yellow-500 hover:text-yellow-400 underline transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToHeading(targetId);
                              window.history.pushState(null, '', href);
                            }}
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      }

                      return (
                        <a
                          href={href}
                          className="text-yellow-500 hover:text-yellow-400 underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4 ml-4" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4 ml-4" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-gray-300" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-red-900 pl-4 py-2 my-6 text-gray-400 italic bg-red-950/10 rounded-r"
                        {...props}
                      />
                    ),
                    code: ({ node, inline, className, children, ...props }: any) => {
                      if (inline) {
                        return (
                          <code
                            className="bg-red-950/30 text-yellow-500 px-1.5 py-0.5 rounded text-sm font-mono"
                            style={{ fontFamily: "'Consolas', 'Monaco', monospace" }}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code
                          className={className}
                          style={{ fontFamily: "'Consolas', 'Monaco', 'Lucida Console', monospace" }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ node, children, ...props }) => (
                      <pre
                        className="bg-black/50 border border-red-900/30 rounded-lg p-4 overflow-x-auto my-6 text-sm whitespace-pre"
                        style={{
                          maxWidth: '100%',
                          overflowX: 'auto',
                          fontFamily: "'Consolas', 'Monaco', 'Lucida Console', 'Courier New', monospace",
                          fontSize: '0.85rem',
                          lineHeight: '1.4'
                        }}
                        {...props}
                      >
                        {children}
                      </pre>
                    ),
                    table: ({ node, children, ...props }) => (
                      <div className="overflow-x-auto my-6">
                        <table
                          className="min-w-full divide-y divide-red-900/30 border border-red-900/30"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ node, children, ...props }) => (
                      <thead className="bg-red-950/30" {...props}>
                        {children}
                      </thead>
                    ),
                    tbody: ({ node, children, ...props }) => (
                      <tbody className="divide-y divide-red-900/30" {...props}>
                        {children}
                      </tbody>
                    ),
                    tr: ({ node, children, ...props }) => (
                      <tr className="hover:bg-red-950/10 transition-colors" {...props}>
                        {children}
                      </tr>
                    ),
                    th: ({ node, children, ...props }) => (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-500 uppercase tracking-wider border-r border-red-900/30 last:border-r-0" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ node, children, ...props }) => (
                      <td className="px-4 py-3 text-sm text-gray-300 border-t border-red-900/30 border-r border-red-900/20 last:border-r-0" {...props}>
                        {children}
                      </td>
                    ),
                    hr: ({ node, ...props }) => (
                      <hr className="border-red-900/30 my-8" {...props} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
