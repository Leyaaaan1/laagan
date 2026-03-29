package leyans.RidersHub.Config.Api;

import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

//@Component
//public class ApiRequestQueue {
//
//    private final BlockingQueue<ApiRequest> requestQueue = new LinkedBlockingQueue<>();
//    private final ThreadPoolTaskScheduler taskScheduler;
//
//    public ApiRequestQueue(ThreadPoolTaskScheduler taskScheduler) {
//        this.taskScheduler = taskScheduler;
//        startQueueProcessor();
//    }
//
//    private void startQueueProcessor() {
//        taskScheduler.scheduleAtFixedRate(() -> {
//            try {
//                ApiRequest request = requestQueue.take(); // Blocks if empty
//                processRequest(request);
//            } catch (InterruptedException e) {
//                Thread.currentThread().interrupt();
//            }
//        }, 1000); // Process every 1 second
//    }
//
//    public void queueRequest(ApiRequest request) {
//        requestQueue.offer(request);
//    }
//
//    private void processRequest(ApiRequest request) {
//        // Execute the API call
//    }
//}