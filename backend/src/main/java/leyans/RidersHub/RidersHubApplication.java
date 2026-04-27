package leyans.RidersHub;

import io.github.cdimascio.dotenv.Dotenv;
import leyans.RidersHub.Config.JWT.JwtConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(JwtConfig.class)
@EnableCaching
@EnableJpaRepositories(basePackages = "leyans.RidersHub.Repository")
public class RidersHubApplication {

	static {
		loadEnvVariables();
	}

	private static void loadEnvVariables() {
		// First, try to load from resources directory (classpath)
		try (InputStream inputStream = RidersHubApplication.class.getClassLoader()
				.getResourceAsStream(".env")) {
			if (inputStream != null) {
				Dotenv dotenv = Dotenv.configure()
						.ignoreIfMissing()
						.load();
				dotenv.entries().forEach(entry ->
						System.setProperty(entry.getKey(), entry.getValue())
				);
				System.out.println("Loaded .env from classpath");
				return;
			}
		} catch (Exception e) {
			System.out.println("Could not load .env from classpath: " + e.getMessage());
		}

		// Fallback: try file system paths
		String[] possiblePaths = {
				"./backend/.env",
				"./.env",
				"backend/.env"
		};

		for (String path : possiblePaths) {
			if (Files.exists(Paths.get(path))) {
				Dotenv dotenv = Dotenv.configure()
						.directory(Paths.get(path).getParent().toString())
						.ignoreIfMissing()
						.load();
				if (!dotenv.entries().isEmpty()) {
					dotenv.entries().forEach(entry ->
							System.setProperty(entry.getKey(), entry.getValue())
					);
					System.out.println("Loaded .env from: " + path);
					return;
				}
			}
		}

		System.out.println("Warning: .env file not found");
	}

	public static void main(String[] args) {
		SpringApplication.run(RidersHubApplication.class, args);
	}
}