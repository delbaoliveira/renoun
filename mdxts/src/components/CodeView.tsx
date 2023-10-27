import * as React from 'react'
import type { SourceFile } from 'ts-morph'
import { Identifier, SyntaxKind } from 'ts-morph'
import { type Theme } from './highlighter'
import { QuickInfo } from './QuickInfo'

export type CodeProps = {
  /** Code snippet to be highlighted. */
  value?: string

  /** Name of the file. */
  filename?: string

  /** Language of the code snippet. */
  language?: string

  /** Show or hide line numbers. */
  lineNumbers?: boolean

  /** VS Code-based theme for highlighting. */
  theme?: Theme
}

/** Renders a code block with syntax highlighting. */
export function CodeView({
  tokens,
  lineNumbers,
  sourceFile,
  filename,
  highlighter,
  language,
  theme,
}: CodeProps & {
  tokens: any
  sourceFile: SourceFile
  highlighter: any
}) {
  const identifierBounds = sourceFile ? getIdentifierBounds(sourceFile, 20) : []

  return (
    <>
      {lineNumbers ? (
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
          }}
        >
          {tokens.map((_, lineIndex) => (
            <div
              style={{
                width: '6ch',
                fontSize: 14,
                lineHeight: '20px',
                paddingRight: '2ch',
                textAlign: 'right',
                color: theme.colors['editorLineNumber.foreground'],
                userSelect: 'none',
              }}
              key={lineIndex}
            >
              {lineIndex + 1}
            </div>
          ))}
        </div>
      ) : null}
      <pre
        style={{
          gridColumn: 2,
          gridRow: 1,
          whiteSpace: 'pre',
          wordWrap: 'break-word',
          fontFamily: 'monospace',
          fontSize: 14,
          lineHeight: '20px',
          letterSpacing: '0px',
          tabSize: 4,
          padding: 0,
          margin: 0,
          borderRadius: 4,
          pointerEvents: 'none',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .identifier:hover {
            background-color: #87add73d;
          }
          .identifier > div {
            display: none;
          }
          .identifier:hover > div {
            display: block;
          }
        `,
          }}
        />
        {identifierBounds.map((bounds, index) => {
          return (
            <>
              <div
                key={index}
                className="identifier"
                style={{
                  position: 'absolute',
                  top: bounds.top,
                  left: bounds.left,
                  width: bounds.width,
                  height: bounds.height,
                  pointerEvents: 'auto',
                }}
              >
                <QuickInfo
                  bounds={bounds}
                  filename={filename}
                  highlighter={highlighter}
                  language={language}
                  position={bounds.start}
                  theme={theme}
                />
              </div>
            </>
          )
        })}
        {tokens.map((line, lineIndex) => {
          return (
            <div key={lineIndex} style={{ height: 20 }}>
              {line.map((token, tokenIndex) => {
                return (
                  <span
                    key={tokenIndex}
                    style={{
                      ...token.fontStyle,
                      color: token.color,
                      textDecoration: token.hasError
                        ? 'red wavy underline'
                        : 'none',
                    }}
                  >
                    {token.content}
                  </span>
                )
              })}
            </div>
          )
        })}
      </pre>
    </>
  )
}

function getIdentifierBounds(sourceFile: SourceFile, lineHeight: number) {
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
  const bounds = identifiers
    .filter((identifier) => {
      const parent = identifier.getParent()
      return !Identifier.isJSDocTag(parent) && !Identifier.isJSDoc(parent)
    })
    .map((identifier) => {
      const start = identifier.getStart()
      const { line, column } = sourceFile.getLineAndColumnAtPos(start)

      return {
        start,
        top: (line - 1) * lineHeight,
        left: `calc(${column - 1} * 1ch)`,
        width: `calc(${identifier.getWidth()} * 1ch)`,
        height: lineHeight,
      }
    })

  return bounds
}