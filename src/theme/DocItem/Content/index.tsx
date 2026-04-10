import React from 'react';
import Content from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

export default function ContentWrapper(props) {
    const {frontMatter} = useDoc();
    const heroImage = frontMatter.image;

    return (
        <>
            {heroImage && (
                <div className="hero-doc-image-wrapper">
                    <img
                        src={heroImage}
                        alt={frontMatter.title || 'Technical Context'}
                        className="hero-doc-image"
                    />
                </div>
            )}
            <Content {...props} />
        </>
    );
}