import * as fs from 'fs/promises';
import path from 'path';

export async function saveDebugInfo(html: string, state: string) {
  try {
    const debugDir = path.join(process.cwd(), 'debug');
    await fs.mkdir(debugDir, { recursive: true });
    
    const filename = `${state.toLowerCase()}-${Date.now()}.html`;
    await fs.writeFile(path.join(debugDir, filename), html);
    
    console.log(`Saved debug HTML to: debug/${filename}`);
  } catch (error) {
    console.error('Failed to save debug info:', error);
  }
} 