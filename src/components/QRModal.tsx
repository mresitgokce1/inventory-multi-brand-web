import React from 'react';
import { useRef } from 'react';
import type { ProductPublic, QRCodeResponse } from '../types';
import { formatPrice } from '../utils/price';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPublic;
  qrData: QRCodeResponse;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, product, qrData }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${product.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .print-container {
              text-align: center;
              max-width: 400px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .qr-code img {
              max-width: 200px;
              height: auto;
              border: 2px solid #333;
              padding: 10px;
              background: white;
            }
            .product-info {
              margin-bottom: 20px;
            }
            .product-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .product-details {
              font-size: 14px;
              color: #666;
              line-height: 1.4;
            }
            .url {
              font-size: 12px;
              color: #888;
              margin-top: 10px;
              word-break: break-all;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-container {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="product-info">
              <div class="product-name">${product.name}</div>
              <div class="product-details">
                ${product.brand} • ${product.category}<br>
                $${formatPrice(product.price).replace('$', '')}
              </div>
            </div>
            <div class="qr-code">
              <img src="data:image/png;base64,${qrData.qr_code}" alt="QR Code for ${product.name}" />
            </div>
            <div class="url">${qrData.url}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">QR Code Generated</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div ref={printRef} className="text-center">
            {/* Product Info */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h4>
              <div className="text-gray-600 space-y-1">
                <div>{product.brand} • {product.category}</div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatPrice(product.price)}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                <img
                  src={`data:image/png;base64,${qrData.qr_code}`}
                  alt={`QR Code for ${product.name}`}
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* URL */}
            <div className="text-xs text-gray-500 break-all mb-6">
              {qrData.url}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Print QR Code
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
            >
              Close
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>Scan this QR code to view product information on mobile devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModal;