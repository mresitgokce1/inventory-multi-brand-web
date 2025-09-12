import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QRModal from '../components/QRModal';
import type { ProductPublic, QRCodeResponse } from '../types';

// Mock the utility functions
vi.mock('../utils/qr', () => ({
  buildQRDataURL: vi.fn(),
  createQRDownloadFilename: vi.fn()
}));

import { buildQRDataURL, createQRDownloadFilename } from '../utils/qr';

describe('QRModal', () => {
  const mockProduct: ProductPublic = {
    id: '1',
    name: 'Test Product',
    price: '29.99',
    brand: 'Test Brand',
    category: 'Test Category',
    description: 'Test description'
  };

  const mockQRData: QRCodeResponse = {
    code: 'ABC123',
    url: 'https://example.com/p/ABC123',
    image_base64: 'iVBORw0KGgoAAAANSUhEUgAA',
    mime_type: 'image/png'
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    product: mockProduct,
    qrData: mockQRData
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildQRDataURL).mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA');
    vi.mocked(createQRDownloadFilename).mockReturnValue('test-product-qr.png');
  });

  it('should not render when isOpen is false', () => {
    render(<QRModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('QR Code Generated')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<QRModal {...defaultProps} />);
    expect(screen.getByText('QR Code Generated')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Brand • Test Category')).toBeInTheDocument();
  });

  it('should display QR image when data URL is available', () => {
    render(<QRModal {...defaultProps} />);
    
    const qrImage = screen.getByAltText('QR Code for Test Product');
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA');
  });

  it('should display fallback when QR data URL is null', () => {
    vi.mocked(buildQRDataURL).mockReturnValue(null);
    
    render(<QRModal {...defaultProps} />);
    
    expect(screen.getByText('QR image unavailable')).toBeInTheDocument();
    expect(screen.getByText('Check console for details')).toBeInTheDocument();
    expect(screen.queryByAltText('QR Code for Test Product')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<QRModal {...defaultProps} onClose={onCloseMock} />);
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledOnce();
  });

  it('should call onClose when Close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<QRModal {...defaultProps} onClose={onCloseMock} />);
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledOnce();
  });

  it('should display download button when QR data URL is available', () => {
    render(<QRModal {...defaultProps} />);
    
    const downloadLink = screen.getByRole('link', { name: 'Download' });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA');
    expect(downloadLink).toHaveAttribute('download', 'test-product-qr.png');
  });

  it('should not display download button when QR data URL is null', () => {
    vi.mocked(buildQRDataURL).mockReturnValue(null);
    
    render(<QRModal {...defaultProps} />);
    
    expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('should disable print button when QR data URL is null', () => {
    vi.mocked(buildQRDataURL).mockReturnValue(null);
    
    render(<QRModal {...defaultProps} />);
    
    const printButton = screen.getByRole('button', { name: 'Print QR Code' });
    expect(printButton).toBeDisabled();
  });

  it('should enable print button when QR data URL is available', () => {
    render(<QRModal {...defaultProps} />);
    
    const printButton = screen.getByRole('button', { name: 'Print QR Code' });
    expect(printButton).not.toBeDisabled();
  });

  it('should display product URL', () => {
    render(<QRModal {...defaultProps} />);
    
    expect(screen.getByText('https://example.com/p/ABC123')).toBeInTheDocument();
  });

  it('should display formatted price', () => {
    render(<QRModal {...defaultProps} />);
    
    // The price formatting might use commas or different formatting
    expect(screen.getByText(/\$29[.,]99/)).toBeInTheDocument();
  });

  it('should call utility functions with correct parameters', () => {
    render(<QRModal {...defaultProps} />);
    
    expect(buildQRDataURL).toHaveBeenCalledWith(mockQRData);
    expect(createQRDownloadFilename).toHaveBeenCalledWith('Test Product', 'image/png');
  });

  describe('Print functionality', () => {
    beforeEach(() => {
      // Mock window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn()
      };
      (window as any).open = vi.fn(() => mockPrintWindow);
    });

    it('should handle print when QR data URL is available', () => {
      render(<QRModal {...defaultProps} />);
      
      const printButton = screen.getByRole('button', { name: 'Print QR Code' });
      fireEvent.click(printButton);
      
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('should not handle print when QR data URL is null', () => {
      vi.mocked(buildQRDataURL).mockReturnValue(null);
      
      render(<QRModal {...defaultProps} />);
      
      const printButton = screen.getByRole('button', { name: 'Print QR Code' });
      fireEvent.click(printButton);
      
      expect(window.open).not.toHaveBeenCalled();
    });
  });
});