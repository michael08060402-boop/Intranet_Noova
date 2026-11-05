import http from 'k6/http';
import { check, sleep } from 'k6';

// Primera prueba: solo HTML público. No inicia sesión ni ejecuta JavaScript.
export const options = {
  scenarios: { hosting: { executor: 'constant-vus', vus: 5, duration: '1m', gracefulStop: '5s' } },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '10s' }],
    checks: ['rate==1'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const respuesta = http.get('https://noova-intranet.web.app/', {
    timeout: '10s', tags: { pagina: 'inicio_publico' },
  });
  check(respuesta, {
    'HTTP 200': (r) => r.status === 200,
    'respuesta HTML': (r) => String(r.headers['Content-Type']).includes('text/html'),
  });
  sleep(5);
}
