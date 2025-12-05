import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Hexagon } from './Hexagon';
import { Cell } from '../types/models';

// Mock the tauri utils
jest.mock('../utils/tauri', () => ({
    getFileIcon: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

describe('Hexagon Component', () => {
    const mockCell: Cell = {
        id: 'test-cell-1',
        type: 'shortcut',
        cube: { x: 0, y: 0, z: 0 },
        title: 'Test App',
        icon: 'data:image/png;base64,test',
    };

    const defaultProps = {
        cell: mockCell,
        size: 60,
        x: 100,
        y: 100,
    };

    it('renders cell title', () => {
        render(
            <svg>
                <Hexagon {...defaultProps} />
            </svg>
        );
        expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    it('applies correct transform', () => {
        const { container } = render(
            <svg>
                <Hexagon {...defaultProps} />
            </svg>
        );
        const gElement = container.querySelector('g');
        expect(gElement).toHaveAttribute('transform', 'translate(100,100)');
    });

    it('applies will-change-transform class for performance', () => {
        const { container } = render(
            <svg>
                <Hexagon {...defaultProps} />
            </svg>
        );
        const gElement = container.querySelector('g');
        expect(gElement).toHaveClass('will-change-transform');
    });
});
