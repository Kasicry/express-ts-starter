#!/usr/bin/env node

// PostgreSQL 상태와 스키마를 조회하는 읽기 전용 MCP 테스트 서버입니다.

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const serverInfo = {
  name: 'express-ts-starter-postgres-readonly',
  version: '1.0.0',
};

let buffer = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  readMessages();
});

process.stdin.on('end', async () => {
  await safeDisconnect();
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function readMessages() {
  while (buffer.length > 0) {
    const message = readContentLengthMessage() || readLineMessage();

    if (!message) {
      return;
    }

    handleMessage(message);
  }
}

function readContentLengthMessage() {
  const headerEnd = buffer.indexOf('\r\n\r\n');

  if (headerEnd === -1) {
    return null;
  }

  const header = buffer.subarray(0, headerEnd).toString('utf8');
  const match = header.match(/Content-Length:\s*(\d+)/i);

  if (!match) {
    return null;
  }

  const contentLength = Number(match[1]);
  const bodyStart = headerEnd + 4;
  const bodyEnd = bodyStart + contentLength;

  if (buffer.length < bodyEnd) {
    return null;
  }

  const body = buffer.subarray(bodyStart, bodyEnd).toString('utf8');
  buffer = buffer.subarray(bodyEnd);
  return JSON.parse(body);
}

function readLineMessage() {
  const lineEnd = buffer.indexOf('\n');

  if (lineEnd === -1) {
    return null;
  }

  const line = buffer.subarray(0, lineEnd).toString('utf8').trim();
  buffer = buffer.subarray(lineEnd + 1);

  if (!line) {
    return null;
  }

  return JSON.parse(line);
}

async function handleMessage(message) {
  if (!message || typeof message !== 'object') {
    return;
  }

  const { id, method, params } = message;

  if (id === undefined || id === null) {
    return;
  }

  try {
    switch (method) {
      case 'initialize':
        sendResult(id, {
          protocolVersion: params?.protocolVersion || '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo,
        });
        break;

      case 'tools/list':
        sendResult(id, {
          tools: getTools(),
        });
        break;

      case 'tools/call':
        await handleToolCall(id, params);
        break;

      default:
        sendError(id, -32601, `지원하지 않는 메서드입니다: ${method}`);
    }
  } catch (error) {
    sendError(id, -32603, error instanceof Error ? error.message : String(error));
  }
}

function getTools() {
  return [
    {
      name: 'db_health',
      description: 'PostgreSQL 연결 상태를 확인합니다.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'list_tables',
      description: 'public 스키마의 테이블 목록을 조회합니다.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'describe_table',
      description: '지정한 public 테이블의 컬럼 정보를 조회합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: '조회할 테이블명',
          },
        },
        required: ['tableName'],
      },
    },
  ];
}

async function handleToolCall(id, params) {
  switch (params?.name) {
    case 'db_health':
      await prisma.$queryRaw`SELECT 1`;
      sendText(id, 'PostgreSQL 연결에 성공했습니다.');
      break;

    case 'list_tables':
      sendJson(
        id,
        await prisma.$queryRaw`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      );
      break;

    case 'describe_table':
      await describeTable(id, params.arguments?.tableName);
      break;

    default:
      sendError(id, -32602, `알 수 없는 도구입니다: ${params?.name}`);
  }
}

async function describeTable(id, tableName) {
  if (!tableName || typeof tableName !== 'string') {
    sendError(id, -32602, 'tableName은 필수 문자열입니다.');
    return;
  }

  sendJson(
    id,
    await prisma.$queryRaw`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `
  );
}

function sendJson(id, value) {
  sendText(id, JSON.stringify(value, null, 2));
}

function sendText(id, text) {
  sendResult(id, {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  });
}

function sendResult(id, result) {
  sendMessage({
    jsonrpc: '2.0',
    id,
    result,
  });
}

function sendError(id, code, message) {
  sendMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  });
}

function sendMessage(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
}

async function shutdown() {
  await safeDisconnect();
  process.exit(0);
}

async function safeDisconnect() {
  try {
    await prisma.$disconnect();
  } catch {
    // 연결 초기화 실패 후 종료될 때는 disconnect 오류를 무시합니다.
  }
}
