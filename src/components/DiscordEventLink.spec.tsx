import { render, screen } from '@testing-library/react';
import { it, describe, expect } from 'vitest';

import '@testing-library/jest-dom';
import DiscordEventLink from './DiscordEventLink';

describe('DiscordEventLink Component', () => {
  it('renders with correct link and text', () => {
    render(
      <DiscordEventLink
        url="https://discord.gg/fj2fqrXf?event=1297836834667233280"
        linkText="Join Our Discord Event"
      />,
    );

    const linkElement = screen.getByText(/Join Our Discord Event/i);
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute(
      'href',
      'https://discord.gg/fj2fqrXf?event=1297836834667233280',
    );
  });

  it('renders description when provided', () => {
    render(
      <DiscordEventLink
        url="https://discord.gg/fj2fqrXf?event=1297836834667233280"
        linkText="Join Our Discord Event"
        description="Click to join the event and connect with others!"
      />,
    );

    const descriptionElement = screen.getByText(
      /Click to join the event and connect with others!/i,
    );
    expect(descriptionElement).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(
      <DiscordEventLink
        url="https://discord.gg/fj2fqrXf?event=1297836834667233280"
        linkText="Join Our Discord Event"
      />,
    );

    const descriptionElement = screen.queryByText(
      /Click to join the event and connect with others!/i,
    );
    expect(descriptionElement).not.toBeInTheDocument();
  });
});
