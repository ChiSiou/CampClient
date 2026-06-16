import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

const CampPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f8fbf4',
      100: '#f2f7e9',
      200: '#e3edcf',
      300: '#cfe0ae',
      400: '#c0d694',
      500: '#b1cc7a',
      600: '#9bbe55',
      700: '#81a33e',
      800: '#647e30',
      900: '#495c23',
      950: '#323f18',
    },
    colorScheme: {
      light: {
        navigation: {
          item: {
            focusBackground: '#f4f7ec',
            activeBackground: '#f4f7ec',
          },
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: CampPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
};
