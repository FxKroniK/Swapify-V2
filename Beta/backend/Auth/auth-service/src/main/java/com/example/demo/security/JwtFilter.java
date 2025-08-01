package com.example.demo.security;

import com.example.demo.entities.Users;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsImpl userService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return path.startsWith("/auth/register") ||
                path.startsWith("/auth/login") ||
                path.startsWith("/auth/reset-password");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("Procesando solicitud en JwtFilter para: " + request.getRequestURI());
        String token = extractToken(request);
        System.out.println("Token extraído: " + token);
        long userId = request.getParameter("userId") != null ? Long.parseLong(request.getParameter("userId")) : 0;

        if (StringUtils.hasText(token) && tokenProvider.isValidToken(token)) {
            String email = tokenProvider.getUsernameFromToken(token);
            System.out.println("Email extraído del token: " + email);
            Users user = (Users) userService.loadUserByUsername(email);
            if (userId != 0 && user.getId() != userId) {
                throw new BadCredentialsException("El token no pertenece al usuario proporcionado.");
            }
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    user, null, user.getAuthorities()
            );

            SecurityContextHolder.getContext().setAuthentication(auth);
            System.out.println("Autenticación establecida para: " + email);
        } else {
            System.out.println("Token inválido o no proporcionado, no se establece autenticación.");
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // 7 para excluir "Bearer "
        }
        return null;
    }
}