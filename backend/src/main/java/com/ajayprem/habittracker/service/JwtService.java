package com.ajayprem.habittracker.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private static final String SECRET_KEY = "your-secret-key-change-this-to-a-long-random-string";

    public String generateToken(Long userId, String email) {
        log.info("generateToken: userId={} email={}", userId, email);
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("email", email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 604800000)) // 7 days
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSignKey() {
        // This is if you want to Base64 encode your key
        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Long extractUserId(String token) {
        try {
            Long id = Long.valueOf(extractAllClaims(token).getSubject());
            log.debug("extractUserId: success id={}", id);
            return id;
        } catch (Exception e) {
            log.warn("extractUserId: failed to extract user id", e);
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            boolean valid = extractAllClaims(token).getExpiration().after(new Date());
            log.debug("isTokenValid: {}", valid);
            return valid;
        } catch (Exception e) {
            log.warn("isTokenValid: token validation failed", e);
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
