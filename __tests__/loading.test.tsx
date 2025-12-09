import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../app/loading';

// Mock de la animación CSS (opcional, pero buena práctica si usa estilos complejos)
vi.mock('../styles/globals.css', () => ({}));

describe('Loading Component', () => {
    it('renders successfully', () => {
        // Renderizamos el componente
        render(<Loading />);

        // Debería empezar con uno de los mensajes aleatorios
        // Como es aleatorio, buscamos cualquier texto en el header h2
        const messageElement = screen.getByRole('heading', { level: 2 });
        expect(messageElement).toBeDefined();
        expect(messageElement.textContent?.length).toBeGreaterThan(0);
    });
});
