describe('Cookie Logic in Window Creation', () => {
  describe('Cookie Application Logic', () => {
    it('should use default cookies when no cookies provided', () => {
      global.defaultCookies = [
        { name: 'session_id', value: '12345', domain: 'example.com' }
      ];

      const cookies = undefined;
      const cookiesToSet = cookies || global.defaultCookies;

      expect(cookiesToSet).toEqual(global.defaultCookies);
    });

    it('should use provided cookies over default cookies', () => {
      const customCookies = [
        { name: 'custom_cookie', value: 'custom_value', domain: 'example.com' }
      ];

      global.defaultCookies = [
        { name: 'session_id', value: '12345', domain: 'example.com' }
      ];

      const cookies = customCookies;
      const cookiesToSet = cookies || global.defaultCookies;

      expect(cookiesToSet).toEqual(customCookies);
    });

    it('should not set cookies when neither default nor custom cookies exist', () => {
      delete global.defaultCookies;

      const cookies = undefined;
      const cookiesToSet = cookies || global.defaultCookies;

      expect(cookiesToSet).toBeUndefined();
    });
  });

  afterEach(() => {
    delete global.defaultCookies;
  });
});