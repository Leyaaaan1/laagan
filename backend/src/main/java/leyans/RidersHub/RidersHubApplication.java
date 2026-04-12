package leyans.RidersHub;

import io.github.cdimascio.dotenv.Dotenv;
import leyans.RidersHub.Config.JWT.JwtConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(JwtConfig.class)
@EnableCaching
public class RidersHubApplication {

	public static void main(String[] args) {
		// Load .env file from classpath or working directory
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		// Apply dotenv variables to system properties
		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(RidersHubApplication.class, args);
	}

}
