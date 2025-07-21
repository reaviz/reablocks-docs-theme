'use client';

import React, { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeProvider, theme } from 'reablocks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vs,
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '../../index';

interface StoryRendererProps {
  storyModule: any;
  storyName: string;
  storyPath: string;
  storybookUrl: string;
  storybookKey?: string;
}

const BUTTON_CLASSNAME =
  'x:whitespace-no-wrap x:border-primary x:inline-flex x:cursor-pointer x:items-center x:justify-center x:border-0 x:dark:bg-black x:bg-gray-100 x:px-2 x:py-1 x:font-sans x:text-xs x:font-semibold x:dark:text-white x:text-black x:select-none x:disabled:cursor-not-allowed x:disabled:text-gray-400 x:data-[variant=filled]:disabled:bg-gray-600';

const extractFunctionFromOriginalFile = async (
  storyPath: string,
  functionName: string
): Promise<string> => {
  try {
    const apiUrl = `/api/story-source?storyPath=${encodeURIComponent(
      storyPath
    )}&functionName=${encodeURIComponent(functionName)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.source || `// No source found for ${functionName}`;
  } catch (error) {
    return `// Error reading file for ${functionName}: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
};

const getStorySource = async (
  storyPath: string,
  storyName: string
): Promise<string> => {
  try {
    return await extractFunctionFromOriginalFile(storyPath, storyName);
  } catch (error) {
    console.error('Error extracting story source:', error);
    return `// Error extracting source for ${storyName}`;
  }
};

export const StoryRenderer: FC<StoryRendererProps> = ({
  storyModule,
  storyName,
  storyPath,
  storybookKey,
  storybookUrl,
}) => {
  const { setTheme, ...rest } = useTheme();
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const [sourceCode, setSourceCode] = useState<string>('// Loading...');

  const story = storyModule[storyName];
  const defaultExport = storyModule.default;

  useEffect(() => {
    getStorySource(storyPath, storyName).then(setSourceCode);
  }, [storyPath, storyName]);

  if (!story) {
    return <div>Story not found: {storyName}</div>;
  }

  const renderStory = () => {
    if (story.render) {
      return story.render(story.args || {}, {
        loaded: {},
        parameters: {},
      });
    }

    if (story.args && defaultExport && defaultExport.component) {
      const Component = defaultExport.component;
      return <Component {...story.args} />;
    }

    if (typeof story === 'function') {
      const args = story.args || {};
      return story(args);
    }

    return <div>Invalid story format: {storyName}</div>;
  };

  const renderedComponent = renderStory();

  return (
    <ThemeProvider theme={theme}>
      <div className='story-container story-preview x:border-gray-200 x:mt-5 x:mb-4 x:rounded-sm x:border x:bg-white x:dark:bg-transparent x:dark:border-gray-800'>
        <div className='x:align-center x:align-items-center x:align-content-center x:flex x:w-full x:flex-col x:flex-wrap x:items-center x:justify-center x:justify-items-center x:px-6 x:py-8'>
          <div>{renderedComponent}</div>
        </div>
        <div className='x:flex x:w-full x:justify-end'>
          <div className='x:-mt-6 x:flex x:items-center x:gap-0'>
            <button
              onClick={() => setIsSourceExpanded(!isSourceExpanded)}
              className={BUTTON_CLASSNAME}
            >
              {isSourceExpanded ? 'Hide code' : 'Show code'}
            </button>
            <button
              className={BUTTON_CLASSNAME}
              onClick={() => {
                console.log('rest', rest);
                setTheme(rest.theme === 'dark' ? 'light' : 'dark');
              }}
            >
              Toggle Theme
            </button>
            {storybookKey && (
              <Link
                className={BUTTON_CLASSNAME}
                href={`${storybookUrl}?path=/story/${storybookKey}`}
                target='_blank'
              >
                View Storybook
              </Link>
            )}
          </div>
        </div>
        {isSourceExpanded && (
          <div className='story-source x:animate-in x:slide-in-from-top-2 x:dark:bg-black x:bg-white x:duration-200'>
            <SyntaxHighlighter
              language='jsx'
              style={rest.theme === 'dark' ? vscDarkPlus : vs}
              className='rb-code-block'
              customStyle={{
                margin: 0,
                flex: '1 1 0%',
                backgroundColor: 'transparent',
                maxWidth: '90vw',
              }}
            >
              {sourceCode}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};
