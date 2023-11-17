import * as React from 'react'
import type { SourceFile } from 'ts-morph'
import { Identifier, SyntaxKind } from 'ts-morph'
import { type Theme, MdxtsJsxOnly } from './highlighter'
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

  /** Lines to highlight. */
  highlight?: string

  /** VS Code-based theme for highlighting. */
  theme?: Theme

  /** Class name to be applied to the code block. */
  className?: string
}

const lineHeight = 20

/** Renders a code block with syntax highlighting. */
export function CodeView({
  row,
  tokens,
  lineNumbers,
  sourceFile,
  filename,
  highlight,
  highlighter,
  language,
  theme,
  isJsxOnly,
  className,
}: CodeProps & {
  row?: [number, number]
  tokens: any
  sourceFile?: SourceFile
  highlighter: any
  isJsxOnly?: boolean
}) {
  const identifierBounds = sourceFile
    ? getIdentifierBounds(sourceFile, isJsxOnly, lineHeight)
    : []
  const shouldHighlightLine = calculateLinesToHighlight(highlight)
  const isAutoGenerated = filename?.includes('mdxts')
  return (
    <>
      {/* {filename ? isAutoGenerated ? null : <h3>{filename}</h3> : null} */}
      {lineNumbers ? (
        <div
          className={className}
          style={{
            gridColumn: 1,
            gridRow: 1,
          }}
        >
          {tokens.map((_, lineIndex) => {
            const shouldHighlight = shouldHighlightLine(lineIndex)
            const isActive = row && row[0] <= lineIndex && lineIndex <= row[1]
            return (
              <div
                key={lineIndex}
                style={{
                  width: '6ch',
                  fontSize: 14,
                  lineHeight: '20px',
                  paddingRight: '2ch',
                  textAlign: 'right',
                  color:
                    shouldHighlight || isActive
                      ? theme.colors['editorLineNumber.activeForeground']
                      : theme.colors['editorLineNumber.foreground'],
                  userSelect: 'none',
                  backgroundColor: shouldHighlight ? '#87add726' : undefined,
                }}
              >
                {lineIndex + 1}
              </div>
            )
          })}
        </div>
      ) : null}
      <pre
        className={className}
        style={{
          gridColumn: 2,
          gridRow: 1,
          whiteSpace: 'pre',
          wordWrap: 'break-word',
          fontSize: 14,
          lineHeight: '20px',
          letterSpacing: '0px',
          tabSize: 4,
          padding: 0,
          margin: '0 0 1.6rem',
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
            cursor: text;
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
            <div
              key={index}
              className="identifier"
              style={{
                position: 'absolute',
                top: bounds.top,
                left: `calc(${bounds.left} * 1ch)`,
                width: `calc(${bounds.width} * 1ch)`,
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
                sourceFile={sourceFile}
              />
            </div>
          )
        })}
        {tokens.map((line, lineIndex) => {
          return (
            <div
              key={lineIndex}
              style={{
                height: 20,
                backgroundColor: shouldHighlightLine(lineIndex)
                  ? '#87add726'
                  : undefined,
              }}
            >
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

export function calculateLinesToHighlight(meta) {
  if (meta === undefined || meta === '') {
    return () => false
  }
  const lineNumbers = meta
    .split(',')
    .map((value) => value.split('-').map((y) => parseInt(y, 10)))

  return (index) => {
    const lineNumber = index + 1
    const inRange = lineNumbers.some(([start, end]) =>
      end ? lineNumber >= start && lineNumber <= end : lineNumber === start
    )
    return inRange
  }
}

/* Get the bounding rectangle of all identifiers in a source file. */
function getIdentifierBounds(
  sourceFile: SourceFile,
  isJsxOnly: boolean,
  lineHeight: number
) {
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
  const importCount = sourceFile.getImportDeclarations().length
  const bounds = identifiers
    .filter((identifier) => {
      const parent = identifier.getParent()
      const isJsxOnlyIdentifier = identifier.getText() === MdxtsJsxOnly
      const isJsxOnlyImport = isJsxOnly
        ? parent?.getKind() === SyntaxKind.ImportSpecifier ||
          parent?.getKind() === SyntaxKind.ImportClause
        : false
      return (
        !Identifier.isJSDocTag(parent) &&
        !Identifier.isJSDoc(parent) &&
        !isJsxOnlyIdentifier &&
        !isJsxOnlyImport
      )
    })
    .map((identifier) => {
      const start = identifier.getStart()
      const { line, column } = sourceFile.getLineAndColumnAtPos(start)
      const yOffset = isJsxOnly ? importCount + 2 : 1
      return {
        start,
        top: (line - yOffset) * lineHeight,
        left: column - 1,
        width: identifier.getWidth(),
        height: lineHeight,
      }
    })

  return bounds
}
