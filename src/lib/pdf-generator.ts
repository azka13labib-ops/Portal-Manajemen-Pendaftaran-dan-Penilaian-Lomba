// pdf-generator.ts
// PDF Generation for certificates using @react-pdf/renderer with React.createElement

import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

// Define styles for certificate PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#050d1a', // Navy dark background matching the site theme
    padding: 40,
    borderWidth: 10,
    borderColor: '#f59e0b', // Gold border for premium accent
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    padding: 30,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  header: {
    fontSize: 32,
    color: '#f1f5f9', // Light text
    marginBottom: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subHeader: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 4,
  },
  bodyText: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 20,
    textAlign: 'center',
  },
  recipientName: {
    fontSize: 28,
    color: '#f59e0b', // Gold name
    marginBottom: 20,
    textAlign: 'center',
  },
  eventText: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 40,
  },
  eventName: {
    color: '#3b82f6', // Blue event title
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 60,
  },
  signatureBlock: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: '#94a3b8',
    marginTop: 40,
    marginBottom: 5,
  },
  signatureTitle: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  dateBlock: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 50,
  },
});

// Helper function to generate PDF stream/blob directly
export async function generateCertificatePDF(
  name: string,
  eventTitle: string,
  type: 'PARTICIPATION' | 'WINNER',
  winnerRank?: string
): Promise<Buffer> {
  const isWinner = type === 'WINNER';
  const displayRank = winnerRank ? winnerRank.replace('_', ' ') : 'Pemenang';

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      React.createElement(
        View,
        { style: styles.innerContainer },
        React.createElement(Text, { style: styles.header }, 'Sertifikat Penghargaan'),
        React.createElement(
          Text,
          { style: styles.subHeader },
          isWinner ? 'PENGHARGAAN JUARA' : 'PENGHARGAAN PARTISIPASI'
        ),
        React.createElement(Text, { style: styles.bodyText }, 'Diberikan dengan hormat kepada:'),
        React.createElement(Text, { style: styles.recipientName }, name),
        isWinner
          ? React.createElement(
              Text,
              { style: styles.eventText },
              'Atas pencapaian luar biasa sebagai ',
              React.createElement(Text, { style: { color: '#f59e0b' } }, displayRank),
              ' dalam kompetisi\n',
              React.createElement(Text, { style: styles.eventName }, eventTitle)
            )
          : React.createElement(
              Text,
              { style: styles.eventText },
              'Atas partisipasi aktif dan dedikasinya sebagai Peserta dalam kompetisi\n',
              React.createElement(Text, { style: styles.eventName }, eventTitle)
            ),
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            View,
            { style: styles.signatureBlock },
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureTitle }, 'Budi Santoso'),
            React.createElement(Text, { style: styles.signatureTitle }, 'Ketua Penyelenggara')
          ),
          React.createElement(
            View,
            { style: { justifyContent: 'center', alignItems: 'center' } },
            React.createElement(Text, { style: styles.dateBlock }, `Tanggal: ${new Date().toLocaleDateString('id-ID')}`)
          ),
          React.createElement(
            View,
            { style: styles.signatureBlock },
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureTitle }, 'Portal Lomba System'),
            React.createElement(Text, { style: styles.signatureTitle }, 'Verifikasi Digital')
          )
        )
      )
    )
  );

  const instance = pdf(doc);
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
