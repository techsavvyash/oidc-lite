import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('interaction')
export class InteractionController {
  @Get(':id')
  serveLoginPage(@Param('id') id: string, @Res() res: Response) {
    const loginHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          form { background: #f0f0f0; padding: 20px; border-radius: 5px; }
          input { display: block; margin: 10px 0; padding: 5px; width: 200px; }
          button { background: #007bff; color: white; border: none; padding: 10px; cursor: pointer; }
        </style>
      </head>
      <body>
        <form action="/login" method="POST">
          <h2>Login</h2>
          <input type="text" name="username" placeholder="Username" required>
          <input type="password" name="password" placeholder="Password" required>
          <input type="hidden" name="interaction_id" value="${id}">
          <button type="submit">Log In</button>
        </form>
      </body>
      </html>
    `;

    res.type('text/html').send(loginHtml);
  }
}
